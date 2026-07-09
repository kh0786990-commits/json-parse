import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import BookPreviewer from "./components/BookPreviewer";
import JsonViewerEditor from "./components/JsonViewerEditor";
import AIPromptRefiner from "./components/AIPromptRefiner";
import SavedBooksList from "./components/SavedBooksList";
import { BookJson, SavedBook } from "./types";
import { sampleBookData } from "./sampleData";
import { BookOpen, Code, HelpCircle, Loader2, RefreshCw, AlertCircle, FileText } from "lucide-react";

export default function App() {
  const [book, setBook] = useState<BookJson | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"reader" | "json">("reader");
  const [error, setError] = useState<string | null>(null);

  // Load saved books from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("saved_books");
    if (saved) {
      try {
        setSavedBooks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved books", e);
      }
    }
  }, []);

  const handleConvert = async (
    files: Array<{fileData: string, mimeType: string, fileName: string}>,
    bookName: string,
    customInstruction: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          bookName,
          customInstruction
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "An error occurred during manuscript processing.");
      }

      const newBook: BookJson = result.data;
      setBook(newBook);
      setActiveTab("reader");

      // Save to lists
      const newEntry: SavedBook = {
        id: Date.now().toString(),
        name: newBook.metadata?.bookName || bookName,
        timestamp: new Date().toISOString(),
        data: newBook,
        fileName: `${files.length} files`,
        fileSize: `${files.length} pages`
      };

      const updatedList = [newEntry, ...savedBooks];
      setSavedBooks(updatedList);
      localStorage.setItem("saved_books", JSON.stringify(updatedList));

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during book parsing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBook = (selected: BookJson) => {
    setBook(selected);
    setActiveTab("reader");
    setError(null);
  };

  const handleDeleteBook = (id: string) => {
    const updated = savedBooks.filter((b) => b.id !== id);
    setSavedBooks(updated);
    localStorage.setItem("saved_books", JSON.stringify(updated));
    
    const deletedBook = savedBooks.find((b) => b.id === id);
    if (deletedBook && book && book.metadata.bookName === deletedBook.data.metadata.bookName) {
      setBook(null);
    }
  };

  const handleLoadSample = () => {
    setBook(sampleBookData);
    setActiveTab("reader");
    setError(null);
  };

  const handleUpdateJson = (updatedJson: BookJson) => {
    setBook(updatedJson);
    
    // Sync to active localStorage item if it exists
    const updated = savedBooks.map((b) => {
      if (b.data.metadata.bookName === updatedJson.metadata.bookName) {
        return { ...b, name: updatedJson.metadata.bookName, data: updatedJson };
      }
      return b;
    });
    setSavedBooks(updated);
    localStorage.setItem("saved_books", JSON.stringify(updated));
  };

  const handleRefineSuccess = (refinedJson: BookJson) => {
    setBook(refinedJson);
    
    // Sync to active localStorage item
    const updated = savedBooks.map((b) => {
      if (b.data.metadata.bookName === refinedJson.metadata.bookName) {
        return { ...b, name: refinedJson.metadata.bookName, data: refinedJson };
      }
      return b;
    });
    setSavedBooks(updated);
    localStorage.setItem("saved_books", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col font-sans text-[#E0E0E0]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-[#1A0C0E] border border-rose-950/50 text-rose-200 p-4 rounded-xl text-sm flex items-start gap-3 justify-start shadow-md">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div className="font-sans text-left leading-relaxed">
              <strong>Conversion Failed:</strong> {error}
              <p className="text-xs text-rose-400 mt-1">Please check your document, try again, or upload a smaller file.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Uploaders and Sidebar Controls */}
          <div className="lg:col-span-4 space-y-6">
            <FileUploader onConvert={handleConvert} isLoading={isLoading} />
            <SavedBooksList
              savedBooks={savedBooks}
              activeBookName={book ? book.metadata.bookName : null}
              onSelectBook={handleSelectBook}
              onDeleteBook={handleDeleteBook}
              onLoadSample={handleLoadSample}
            />
          </div>

          {/* Right Column: Visualization & Code Playground */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            
            {book ? (
              <>
                {/* Visual Tabs Navigation */}
                <div className="bg-[#0D0D0E] p-1.5 rounded-xl border border-[#222] flex items-center justify-between shadow-md font-sans">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setActiveTab("reader")}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === "reader"
                          ? "bg-[#D4AF37] text-black shadow-md font-bold"
                          : "hover:bg-[#1A1A1C] text-slate-400"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Reader Mode
                    </button>
                    <button
                      onClick={() => setActiveTab("json")}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === "json"
                          ? "bg-[#D4AF37] text-black shadow-md font-bold"
                          : "hover:bg-[#1A1A1C] text-slate-400"
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      Raw JSON
                    </button>
                  </div>
                  
                  <span className="text-xs font-mono text-slate-400 px-3 truncate max-w-[200px]" dir="auto">
                    Active Book: {book.metadata.bookName}
                  </span>
                </div>

                {/* Tab content area */}
                <div className="flex-1">
                  {activeTab === "reader" ? (
                    <BookPreviewer book={book} />
                  ) : (
                    <JsonViewerEditor json={book} onUpdateJson={handleUpdateJson} />
                  )}
                </div>

                {/* AI refinement always available under current active book */}
                <AIPromptRefiner currentJson={book} onRefineSuccess={handleRefineSuccess} />
              </>
            ) : (
              /* Beautiful Blank Landing Screen */
              <div className="bg-[#0D0D0E] border border-[#222] rounded-xl p-10 sm:p-16 text-center space-y-6 shadow-xl flex flex-col items-center justify-center min-h-[550px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -ml-16 -mt-16 opacity-40" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mb-16 opacity-40" />
                
                {isLoading ? (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-xl animate-pulse" />
                      <div className="relative bg-[#1A1A1C] border border-[#333] p-6 rounded-full shadow-lg">
                        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-2 max-w-sm font-sans text-center">
                      <h3 className="text-lg font-bold text-slate-200">Analyzing manuscript...</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Gemini AI is parsing Arabic grammar, diacritics, and generating Urdu translations with precise historical annotations. This may take a moment.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-lg flex flex-col items-center font-sans">
                    <div className="bg-[#1A1A1C] text-[#D4AF37] p-5 rounded-2xl border border-[#333] shadow-md">
                      <BookOpen className="w-8 h-8" />
                    </div>

                    <div className="space-y-2.5 text-center">
                      <h3 className="text-xl font-bold text-slate-100">Convert Arabic & Urdu Manuscripts to JSON Databases</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Upload your PDF, JP2, or image scans. Our AI model automatically identifies chapters, segments, Arabic text with diacritics, Urdu translations, and commentary to synthesize a production-ready structured database.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
                      <button
                        onClick={handleLoadSample}
                        className="bg-[#D4AF37] hover:bg-[#C19A2E] text-black text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Load Sample Book (Al-Bidayah wan-Nihayah)
                      </button>
                    </div>

                    {/* Features list */}
                    <div className="grid grid-cols-2 gap-4 pt-8 w-full max-w-md text-left border-t border-[#222]">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#D4AF37]">Bilingual Layout</h4>
                        <p className="text-[10px] text-slate-500">Simultaneous view of original Arabic script and Urdu translation.</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#D4AF37]">Live JSON Playground</h4>
                        <p className="text-[10px] text-slate-500">Edit values or structures manually or with AI guidance.</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#D4AF37]">AI Commentary</h4>
                        <p className="text-[10px] text-slate-500">Get automatic tafsir, historical footnotes, and explanations.</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#D4AF37]">Schema Export</h4>
                        <p className="text-[10px] text-slate-500">Download fully schema-compliant structured JSON with one click.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      <footer className="bg-[#0D0D0E] border-t border-[#222] py-6 mt-12 text-center text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 Digital Manuscript Platform. All rights reserved.</span>
          <span className="flex items-center gap-1 text-[#D4AF37] font-medium">
            Preserving History and Narratives through Modern Intelligent Structures
          </span>
        </div>
      </footer>
    </div>
  );
}
