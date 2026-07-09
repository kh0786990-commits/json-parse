import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promises as fs } from "fs";
import crypto from "crypto";
import os from "os";

dotenv.config();

// Ensure output directory exists
const outputDir = path.join(process.cwd(), "output");

// Helper to run a shell command
function runCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Helper to convert JP2 base64 data to JPEG using ImageMagick
async function convertJp2ToJpeg(base64Data: string): Promise<string> {
  const tempDir = os.tmpdir();
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const inputPath = path.join(tempDir, `${uniqueId}.jp2`);
  const outputPath = path.join(tempDir, `${uniqueId}.jpg`);

  try {
    // Write JP2 base64 data to temp file
    const buffer = Buffer.from(base64Data, "base64");
    await fs.writeFile(inputPath, buffer);

    // Convert JP2 to JPEG using ImageMagick (quality 85 to optimize payload size)
    // Use 'convert' command for Linux/Railway, 'magick' for Windows
    const platform = process.platform;
    const command = platform === 'win32' 
      ? `magick "${inputPath}" -quality 85 "${outputPath}"`
      : `convert "${inputPath}" -quality 85 "${outputPath}"`;
    await runCommand(command);

    // Read converted JPEG file
    const convertedBuffer = await fs.readFile(outputPath);
    return convertedBuffer.toString("base64");
  } finally {
    // Clean up temp files
    fs.unlink(inputPath).catch(() => {});
    fs.unlink(outputPath).catch(() => {});
  }
}

// Helper to retry a function with exponential backoff on transient errors (like 503 Service Unavailable, 429 Rate Limit)
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 4,
  delay = 1500,
  factor = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) {
      throw error;
    }
    const errMsg = String(error.message || error).toLowerCase();
    const status = error.status || error.statusCode || (error.error && error.error.code);
    
    const isRateLimit = errMsg.includes("429") || status === 429 || errMsg.includes("rate limit") || errMsg.includes("quota exceeded");
    const isServiceUnavailable = errMsg.includes("503") || status === 503 || errMsg.includes("unavailable") || errMsg.includes("high demand") || errMsg.includes("overloaded");
    
    if (isRateLimit || isServiceUnavailable) {
      console.warn(`Transient API error (status: ${status}, msg: ${error.message || error}) encountered. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * factor, factor);
    }
    throw error;
  }
}

// Helper to call generateContent with fallback models in case the preferred model is overloaded or down
async function generateContentWithFallback(
  ai: any,
  options: {
    contents: any;
    config: any;
  }
): Promise<any> {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`Attempting generateContent using model: ${model}`);
      const result = await retryWithBackoff(
        () =>
          ai.models.generateContent({
            model,
            contents: options.contents,
            config: options.config,
          }),
        2, // 2 retries per model, so we switch to fallback quickly
        1000,
        2
      );
      console.log(`Successfully completed generateContent with model: ${model}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${model} failed with error: ${error.message || error}. Trying next fallback...`);
    }
  }

  throw lastError;
}

const app = express();
const PORT = 3000;

// Setup increased payload limits for base64 file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// JSON schema definition for Batch Book structure
const bookSchema = {
  type: Type.OBJECT,
  properties: {
    metadata: {
      type: Type.OBJECT,
      properties: {
        bookName: { 
          type: Type.STRING, 
          description: "Name of the book in Arabic or Urdu" 
        },
        totalFiles: { 
          type: Type.STRING, 
          description: "Total number of files processed" 
        }
      },
      required: ["bookName", "totalFiles"]
    },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pageNumber: { 
            type: Type.INTEGER, 
            description: "The page number" 
          },
          content: { 
            type: Type.STRING, 
            description: "The complete text content of the page" 
          }
        },
        required: ["pageNumber", "content"]
      }
    }
  },
  required: ["metadata", "pages"]
};

// API Endpoint to check backend health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Converter Backend is running smoothly" });
});

// API Endpoint to convert PDF/JP2/Image to JSON (batch processing)
app.post("/api/convert", async (req, res) => {
  try {
    const { files, bookName, customInstruction } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "Missing files array or empty files" });
    }

    console.log(`Received request to process ${files.length} files for book: ${bookName || 'Unnamed'}`);

    // Sort files by filename to ensure correct order
    const sortedFiles = [...files].sort((a, b) => {
      const nameA = (a.fileName || '').toLowerCase();
      const nameB = (b.fileName || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    console.log(`Processing files in order: ${sortedFiles.map(f => f.fileName).join(', ')}`);

    // Convert all files and prepare binary parts
    const binaryParts = [];
    for (const file of sortedFiles) {
      let finalFileData = file.fileData;
      let finalMimeType = file.mimeType;

      // Detect if we need to convert JP2/JPEG 2000
      const isJp2 = (file.mimeType && file.mimeType.toLowerCase().includes("jp2")) || 
                    (file.mimeType && file.mimeType.toLowerCase().includes("jpeg2000")) || 
                    (file.fileName && file.fileName.toLowerCase().endsWith(".jp2"));

      if (isJp2) {
        console.log(`JP2 file format detected for ${file.fileName}. Converting to JPEG using ImageMagick...`);
        try {
          finalFileData = await convertJp2ToJpeg(file.fileData);
          finalMimeType = "image/jpeg";
          console.log(`Successfully converted ${file.fileName} to JPEG.`);
        } catch (convErr: any) {
          console.error(`ImageMagick JP2 conversion failed for ${file.fileName}:`, convErr);
          throw new Error(`Failed to decode/convert JP2 image ${file.fileName}: ${convErr.message || convErr}`);
        }
      }

      binaryParts.push({
        inlineData: {
          data: finalFileData,
          mimeType: finalMimeType
        }
      });
    }

    const promptText = `
      Role: You are a Batch Data Processing Engine for a multi-page E-book Application.

      Task: Process the attached images in the exact order provided. Extract text from each, maintain their page sequence, and compile them into one unified JSON object.

      Instructions for the Output:

      Sequence Management: You MUST process files in the exact order they are provided. The first image is page 1, second is page 2, etc.

      JSON Structure: Return the output in the following single JSON object format:

      {
        "metadata": {
          "bookName": "${bookName || 'Unknown Book'}",
          "totalFiles": "${sortedFiles.length}"
        },
        "pages": [
          {
            "pageNumber": 1,
            "content": "COMPLETE_TEXT_FROM_PAGE_1"
          },
          {
            "pageNumber": 2,
            "content": "COMPLETE_TEXT_FROM_PAGE_2"
          }
        ]
      }

      Constraints:

      NO summaries, NO explanations, NO intro/outro text.

      ONLY valid JSON.

      Extract text completely for every page.

      Ensure the 'pages' array contains every single page image provided in the prompt, in order.

      Book Name: ${bookName || 'Unknown Book'}
      
      Total Files: ${sortedFiles.length}

      ${customInstruction ? `Additional User Guidance: ${customInstruction}` : ''}
    `;

    // Build contents array with all binary parts followed by prompt
    const contents = [...binaryParts, { text: promptText }];

    const response = await generateContentWithFallback(ai, {
      contents,
      config: {
        systemInstruction: "You are a batch data processing engine. Process multiple images in order and extract complete text from each page without summarization.",
        responseMimeType: "application/json",
        responseSchema: bookSchema
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response text received from Gemini API");
    }

    // Try parsing JSON to guarantee validity before returning
    const parsedData = JSON.parse(outputText);

    // Auto-save JSON to output folder
    const jsonBookName = parsedData.metadata?.bookName || "book";
    const sanitizedBookName = jsonBookName.replace(/[^a-z0-9\u0600-\u06FF]/gi, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${sanitizedBookName}_${timestamp}.json`;
    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(parsedData, null, 2), 'utf-8');
    console.log(`JSON saved to: ${filePath}`);

    res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Conversion Error:", error);
    res.status(500).json({ 
      error: "Failed to convert file", 
      details: error.message || error 
    });
  }
});

// API Endpoint to refine/edit JSON using AI Chat
app.post("/api/refine", async (req, res) => {
  try {
    const { currentJson, instruction } = req.body;

    if (!currentJson || !instruction) {
      return res.status(400).json({ error: "Missing current JSON or instruction" });
    }

    console.log("Received refinement instruction:", instruction);

    const promptText = `
      You are a meticulous book editor. You are provided with a structured book database JSON and a user's instruction to modify/refine it.
      
      CURRENT JSON:
      ${JSON.stringify(currentJson, null, 2)}
      
      USER REFINEMENT INSTRUCTION:
      "${instruction}"
      
      Your task is to modify the book JSON based strictly on the user's instructions while preserving all other elements and ensuring the strict structure remains 100% compliant with the schema.
      
      The JSON structure has metadata (bookName, totalFiles) and pages array (pageNumber, content).
      
      Return ONLY the revised JSON conforming to the requested schema.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: "You are a JSON refinement assistant. Edit the provided JSON as requested by the user, and output the updated JSON matching the schema with metadata and pages array.",
        responseMimeType: "application/json",
        responseSchema: bookSchema
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response text received from Gemini refinement");
    }

    const parsedData = JSON.parse(outputText);
    res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Refinement Error:", error);
    res.status(500).json({ 
      error: "Failed to refine book JSON", 
      details: error.message || error 
    });
  }
});

async function startServer() {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Vite dev middleware for asset serving in non-production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
