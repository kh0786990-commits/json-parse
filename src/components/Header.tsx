import React from "react";
import { BookOpen, Languages, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-[#0D0D0E] border-b border-[#222] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#D4AF37] text-black p-2.5 rounded-lg flex items-center justify-center font-bold shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-wider text-[#E0E0E0] font-sans uppercase">
                Al-Khatib Parser v1.2
              </h1>
              <span className="bg-[#222] text-[#D4AF37] text-[10px] font-bold px-2 py-0.5 rounded-sm border border-[#D4AF37]/30 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Gemini 3.5
              </span>
            </div>
            <p className="text-[10px] text-[#888] font-mono uppercase tracking-widest mt-0.5">
              Neural OCR & Bilingual Schema Mapping
            </p>
          </div>
        </div>

        {/* Subtitle info section */}
        <div className="flex items-center gap-3 md:text-right md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#222]">
          <div className="text-right">
            <div className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider font-sans">
              Digital Manuscript Platform
            </div>
            <div className="text-[9px] text-[#888] font-mono tracking-widest uppercase">
              Bilingual Arabic & Urdu OCR-to-JSON
            </div>
          </div>
          <div className="bg-[#1A1A1C] text-slate-300 p-2 rounded-lg border border-[#333]">
            <Languages className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
