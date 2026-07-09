import React, { useState, useRef } from "react";
import { Upload, FileText, Image as ImageIcon, AlertTriangle, Settings, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface FileUploaderProps {
  onConvert: (files: Array<{fileData: string, mimeType: string, fileName: string}>, bookName: string, customInstruction: string) => Promise<void>;
  isLoading: boolean;
}

export default function FileUploader({ onConvert, isLoading }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [base64DataMap, setBase64DataMap] = useState<Map<string, string>>(new Map());
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [bookName, setBookName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (selectedFiles: FileList | File[]) => {
    setError(null);
    const validTypes = [
      "application/pdf",
      "image/jp2",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    const filesArray = Array.from(selectedFiles);
    const newFiles: File[] = [];
    const newBase64Map = new Map(base64DataMap);

    for (const selectedFile of filesArray) {
      // Some JP2 files might not have correct mime types in browser, check extension as fallback
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const isJp2 = fileExtension === 'jp2' || selectedFile.type === 'image/jp2';
      
      if (!validTypes.includes(selectedFile.type) && !isJp2) {
        setError(`File ${selectedFile.name} is not supported. Only PDF, JP2 (JPEG 2000), and standard image formats (PNG, JPG, WEBP) are supported.`);
        return;
      }

      // Limit to 25MB for direct transfer
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError(`File ${selectedFile.name} exceeds 25MB limit.`);
        return;
      }

      newFiles.push(selectedFile);

      // Read file and store base64
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result.split(",")[1];
          newBase64Map.set(selectedFile.name, base64);
          setBase64DataMap(new Map(newBase64Map));
        }
      };
      reader.onerror = () => {
        setError(`Failed to read file ${selectedFile.name}. Please try again.`);
      };
      reader.readAsDataURL(selectedFile);
    }

    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter(f => f.name !== fileName));
    const newMap = new Map(base64DataMap);
    newMap.delete(fileName);
    setBase64DataMap(newMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !bookName) {
      setError("Please upload at least one file and provide a book name.");
      return;
    }

    // Prepare files array for API
    const filesArray = files.map(file => {
      let mimeType = file.type;
      // Map JP2 manually if empty or not recognized
      if (!mimeType && file.name.endsWith('.jp2')) {
        mimeType = "image/jp2";
      }
      const base64 = base64DataMap.get(file.name);
      if (!base64) {
        throw new Error(`Base64 data not found for file: ${file.name}`);
      }
      return {
        fileData: base64,
        mimeType: mimeType || "application/octet-stream",
        fileName: file.name
      };
    });

    await onConvert(filesArray, bookName, customInstruction);
  };

  return (
    <div className="bg-[#0D0D0E] rounded-xl border border-[#222] shadow-lg overflow-hidden">
      <div className="border-b border-[#222] bg-[#111] px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          Book Upload & Settings
        </h2>
        <span className="text-xs text-[#D4AF37] bg-[#222] px-2.5 py-1 rounded-sm border border-[#D4AF37]/20 font-medium">
          Arabic-Urdu Specialist
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Book Name Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold tracking-wider uppercase text-slate-400">
            Book Name *
          </label>
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            placeholder="e.g., البداية والنهاية - جلد اول"
            className="w-full text-left px-4 py-3 bg-[#050505] border border-[#222] rounded-xl text-sm text-[#E0E0E0] focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] placeholder-slate-600 leading-relaxed font-sans"
            disabled={isLoading}
          />
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-[#D4AF37] bg-[#D4AF37]/5"
              : files.length > 0
              ? "border-[#444] bg-[#1A1A1C]"
              : "border-[#333] hover:border-[#444] bg-[#0A0A0B]"
          }`}
          onClick={onButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jp2,.jpg,.jpeg,.png,.webp"
            onChange={handleChange}
            disabled={isLoading}
            multiple
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            {files.length > 0 ? (
              <div className="bg-[#D4AF37]/25 text-[#D4AF37] p-4 rounded-full border border-[#D4AF37]/40 shadow-sm">
                <Upload className="w-10 h-10" />
              </div>
            ) : (
              <div className="bg-[#1A1A1C] text-slate-400 p-4 rounded-full border border-[#222]">
                <Upload className="w-10 h-10" />
              </div>
            )}

            <div className="space-y-1">
              {files.length > 0 ? (
                <div>
                  <p className="font-medium text-slate-200 text-sm">
                    {files.length} file(s) selected
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Click to add more files
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-slate-300 text-sm">
                    Drag & drop your PDF or JP2 files here, or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports: PDF, JP2, PNG, JPEG, WEBP (Max: 25MB per file) - Multiple files supported
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <label className="block text-xs font-bold tracking-wider uppercase text-slate-400">
              Selected Files ({files.length})
            </label>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between bg-[#1A1A1C] border border-[#333] rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-slate-500 font-mono text-xs">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || "JP2 Image"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                    disabled={isLoading}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#1A0C0E] border border-rose-950/50 rounded-lg p-3 text-sm text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="font-sans leading-relaxed text-left w-full text-xs">
              {error}
            </div>
          </div>
        )}

        {/* Custom Instructions */}
        <div className="space-y-2">
          <label className="block text-xs font-bold tracking-wider uppercase text-slate-400">
            Additional Parsing Instructions (Optional)
          </label>
          <textarea
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="e.g., 'Only extract chapters 1 and 2' or 'Add extensive historical explanations for Arabic reports'..."
            rows={3}
            className="w-full text-left px-4 py-3 bg-[#050505] border border-[#222] rounded-xl text-sm text-[#E0E0E0] focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] placeholder-slate-600 leading-relaxed font-sans"
            disabled={isLoading}
          />
        </div>

        {/* Informational Box */}
        <div className="bg-[#1A1A1C] border border-[#333] rounded-xl p-4 text-xs text-slate-300 space-y-1.5 leading-relaxed">
          <div className="font-bold flex items-center gap-1.5 text-[#D4AF37]">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            Extraction Guidelines:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400 font-sans">
            <li>Arabic text is extracted with full diacritics (Tashkeel) and high fidelity.</li>
            <li>Scholarly Urdu translation & commentaries are generated side-by-side.</li>
            <li>Processing time depends on file length and model queue states.</li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={files.length === 0 || !bookName || isLoading}
          className="w-full bg-[#D4AF37] hover:bg-[#C19A2E] disabled:bg-[#222] disabled:text-slate-600 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-950/10 active:scale-[0.98] uppercase tracking-wider text-xs cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing manuscript, please wait...</span>
            </>
          ) : (
            <>
              <span>Parse Documents & Get JSON</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
