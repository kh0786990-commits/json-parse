import React from "react";
import { SavedBook, BookJson } from "../types";
import { Bookmark, Trash2, Calendar, FileJson, FileText, ArrowLeftRight } from "lucide-react";

interface SavedBooksListProps {
  savedBooks: SavedBook[];
  activeBookName: string | null;
  onSelectBook: (book: BookJson) => void;
  onDeleteBook: (id: string) => void;
  onLoadSample: () => void;
}

export default function SavedBooksList({
  savedBooks,
  activeBookName,
  onSelectBook,
  onDeleteBook,
  onLoadSample
}: SavedBooksListProps) {
  return (
    <div className="bg-[#0D0D0E] rounded-xl border border-[#222] shadow-lg overflow-hidden">
      <div className="border-b border-[#222] bg-[#111] px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-slate-400" />
          Saved Transcripts & Databases
        </h2>
        <span className="text-xs font-mono text-slate-500">
          Saved: {savedBooks.length}
        </span>
      </div>

      <div className="p-6 space-y-4">
        {/* Quick Sample Loader Button */}
        <div className="bg-[#1A1A1C] rounded-xl p-4 border border-[#333] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#D4AF37]">
              Reference Sample (Al-Bidayah wan-Nihayah)
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans mt-0.5">
              Load a pre-parsed, structured Arabic-Urdu database schema to inspect the platform features.
            </p>
          </div>
          <button
            onClick={onLoadSample}
            className="shrink-0 bg-[#D4AF37] hover:bg-[#C19A2E] text-black text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Load Sample Book
          </button>
        </div>

        {/* Saved List */}
        {savedBooks.length > 0 ? (
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {savedBooks.map((book) => {
              const isActive = activeBookName === book.data.metadata.bookName;
              return (
                <div
                  key={book.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? "bg-[#1A1A1C] border-[#D4AF37] ring-1 ring-[#D4AF37]/10"
                      : "bg-[#0A0A0B] hover:bg-[#121214] border-[#222]"
                  }`}
                >
                  <button
                    onClick={() => onDeleteBook(book.id)}
                    className="text-slate-500 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-950/20 transition-all shrink-0 cursor-pointer"
                    title="Delete Saved Book"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectBook(book.data)}
                    className="flex-1 text-left pl-4 pr-1.5 flex flex-col gap-1 items-start overflow-hidden cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-200 truncate w-full text-right" dir="rtl">
                      {book.data.metadata.bookName}
                    </span>
                    <span className="text-xs text-slate-400 font-sans truncate w-full">
                      Files: {book.data.metadata.totalFiles}
                    </span>
                    
                    <div className="flex items-center gap-x-2.5 text-[10px] text-slate-500 font-mono mt-1 w-full justify-start">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(book.timestamp).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{book.fileSize}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-[#333] rounded-xl p-8 text-center text-slate-500 font-sans text-xs space-y-1">
            <p>No custom documents parsed yet</p>
            <p className="text-[10px] text-slate-600">Upload a file or click "Load Sample Book" above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
