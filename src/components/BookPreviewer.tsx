import React, { useState } from "react";
import { BookJson, BookPage } from "../types";
import { Book, FileText, ListFilter, AlignLeft } from "lucide-react";

interface BookPreviewerProps {
  book: BookJson;
}

export default function BookPreviewer({ book }: BookPreviewerProps) {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  const currentPage = book.pages[selectedPageIndex];

  return (
    <div className="space-y-6">
      {/* Book Metadata Card */}
      <div className="bg-[#0D0D0E] rounded-xl border border-[#222] shadow-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-full -mr-10 -mt-10 opacity-50 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#1A1A1C] text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-sm border border-[#333]">
                Total Files: {book.metadata.totalFiles}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 urdu-text mb-1 text-left" dir="auto">
              {book.metadata.bookName}
            </h2>
          </div>
        </div>
      </div>

      {/* Pages Navigation and content area */}
      {book.pages.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Page selector rail */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-xs text-slate-400 tracking-wider uppercase font-sans flex items-center gap-1.5 px-1">
              <ListFilter className="w-3.5 h-3.5 text-[#D4AF37]" />
              Pages List
            </h3>
            
            <div className="space-y-1.5 max-h-[300px] lg:max-h-none overflow-y-auto pr-1">
              {book.pages.map((page, idx) => (
                <button
                  key={page.pageNumber}
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedPageIndex === idx
                      ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-md shadow-amber-950/20 font-semibold"
                      : "bg-[#0D0D0E] hover:bg-[#121214] text-slate-300 border-[#222]"
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedPageIndex === idx ? 'text-black/70' : 'text-slate-500'}`}>
                    Page {page.pageNumber}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Page Content Main Frame */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active Page Details Header */}
            <div className="bg-[#0D0D0E] rounded-xl border border-[#222] p-6 shadow-lg space-y-4">
              <div className="border-b border-[#222] pb-3 flex justify-between items-center">
                <span className="bg-[#222] text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-sm border border-[#D4AF37]/20">
                  Page {currentPage.pageNumber} Details
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Page {currentPage.pageNumber} of {book.pages.length}
                </span>
              </div>

              <div className="bg-[#1A1A1C] rounded-lg p-5 border border-[#333] space-y-2 text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Page Content:</h4>
                <p className="text-sm text-slate-300 leading-relaxed text-right urdu-text whitespace-pre-wrap" dir="rtl">
                  {currentPage.content}
                </p>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-[#0D0D0E] rounded-xl border border-[#222] shadow-lg p-12 text-center text-slate-500 font-sans">
          No pages extracted yet.
        </div>
      )}
    </div>
  );
}
