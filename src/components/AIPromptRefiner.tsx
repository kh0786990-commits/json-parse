import React, { useState } from "react";
import { Sparkles, Loader2, RefreshCcw, Send, CheckCircle } from "lucide-react";
import { BookJson } from "../types";

interface AIPromptRefinerProps {
  currentJson: BookJson;
  onRefineSuccess: (refinedJson: BookJson) => void;
}

export default function AIPromptRefiner({ currentJson, onRefineSuccess }: AIPromptRefinerProps) {
  const [instruction, setInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isRefining) return;

    setIsRefining(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentJson,
          instruction: instruction.trim()
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to refine JSON.");
      }

      onRefineSuccess(result.data);
      setInstruction("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during AI refinement.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="bg-[#0D0D0E] rounded-xl border border-[#222] shadow-lg overflow-hidden">
      <div className="border-b border-[#222] bg-[#111] px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          AI Refinement & Corrections (AI JSON Refiner)
        </h2>
        <span className="text-xs bg-[#222] text-[#D4AF37] px-2.5 py-1 rounded-sm font-medium border border-[#D4AF37]/20">
          Interactive AI Editor
        </span>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-400 leading-relaxed text-left font-sans">
          You can issue direct English or Urdu instructions to Gemini AI to update the generated database. E.g., "Fix spelling errors in page 1", "Reformat the content", or "Add more details to page 2."
        </p>

        <form onSubmit={handleRefine} className="space-y-4">
          <div className="relative">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Type your instruction here... (e.g., 'Fix spelling errors in page 1')"
              rows={2}
              className="w-full text-left pr-4 pl-12 py-3 bg-[#050505] border border-[#222] rounded-xl text-sm text-[#E0E0E0] focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] placeholder-slate-600 font-sans"
              disabled={isRefining}
            />
            
            <div className="absolute left-3 bottom-3">
              <button
                type="submit"
                disabled={!instruction.trim() || isRefining}
                className="bg-[#D4AF37] hover:bg-[#C19A2E] disabled:bg-[#222] disabled:text-slate-600 text-black p-2.5 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {isRefining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </form>

        {success && (
          <div className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2.5 justify-start">
            <CheckCircle className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div className="text-left text-xs">
              <strong>Database successfully updated!</strong> Review the updated JSON or reader below.
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/20 border border-rose-900/50 text-rose-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2.5 justify-start">
            <div className="font-sans text-left leading-relaxed text-xs">
              <strong>Refinement failed:</strong> {error}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-start pt-1 font-sans">
          <button
            onClick={() => setInstruction("Fix spelling and formatting errors in all pages")}
            className="bg-[#1A1A1C] hover:bg-[#222] text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-[#333] transition-all cursor-pointer"
          >
            Fix Spelling & Formatting
          </button>
          <button
            onClick={() => setInstruction("Improve the content quality and add missing details")}
            className="bg-[#1A1A1C] hover:bg-[#222] text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-[#333] transition-all cursor-pointer"
          >
            Improve Content Quality
          </button>
          <button
            onClick={() => setInstruction("Reorganize the page content for better readability")}
            className="bg-[#1A1A1C] hover:bg-[#222] text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-[#333] transition-all cursor-pointer"
          >
            Reorganize Content
          </button>
        </div>

      </div>
    </div>
  );
}
