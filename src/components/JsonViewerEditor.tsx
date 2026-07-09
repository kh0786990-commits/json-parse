import React, { useState, useEffect } from "react";
import { BookJson } from "../types";
import { Copy, Check, Download, Edit2, Play, AlertCircle, FileJson } from "lucide-react";

interface JsonViewerEditorProps {
  json: BookJson;
  onUpdateJson: (newJson: BookJson) => void;
}

export default function JsonViewerEditor({ json, onUpdateJson }: JsonViewerEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(JSON.stringify(json, null, 2));
  }, [json]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${json.metadata?.bookName?.replace(/[^a-z0-9]/gi, '_') || "book_database"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSaveEdit = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(editValue);
      
      // Basic schema check
      if (!parsed.metadata || !parsed.pages) {
        throw new Error("JSON structure must contain metadata and pages array.");
      }
      
      onUpdateJson(parsed);
      setIsEditing(false);
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON formatting. Check for missing brackets, quotes, or trailing commas.");
    }
  };

  return (
    <div className="bg-[#050505] rounded-xl border border-[#222] shadow-lg overflow-hidden flex flex-col h-full">
      
      {/* Header and Control Bar */}
      <div className="border-b border-[#222] bg-[#0D0D0E] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileJson className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="font-semibold text-slate-200 font-sans text-xs tracking-wide uppercase">
            Database JSON Schema
          </h2>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                className="bg-[#D4AF37] hover:bg-[#C19A2E] text-black text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer font-sans"
              >
                <Play className="w-3.5 h-3.5" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditValue(JSON.stringify(json, null, 2));
                  setIsEditing(false);
                  setJsonError(null);
                }}
                className="bg-[#222] hover:bg-[#333] text-slate-300 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg active:scale-95 transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#1A1A1C] hover:bg-[#222] text-slate-300 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-[#333] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-sans"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Edit Database
              </button>
              <button
                onClick={handleCopy}
                className="bg-[#1A1A1C] hover:bg-[#222] text-slate-300 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-[#333] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-sans"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="bg-[#222] text-[#D4AF37] hover:bg-[#2A2A2D] text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-[#D4AF37]/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-sans"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 flex flex-col min-h-[450px]">
        {isEditing ? (
          <div className="flex-1 flex flex-col space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 w-full bg-[#0A0A0B] text-slate-200 font-mono text-xs p-4 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]/20 resize-y min-h-[380px] leading-relaxed border border-[#222]"
              spellCheck="false"
            />
            {jsonError && (
              <div className="bg-[#1A0C0E] border border-rose-950/50 text-rose-200 p-3.5 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <span className="font-sans leading-relaxed">{jsonError}</span>
              </div>
            )}
          </div>
        ) : (
          <pre className="flex-1 w-full bg-[#050505] text-[#9CDCFE] font-mono text-xs p-5 rounded-lg overflow-auto select-all selection:bg-[#222] selection:text-white max-h-[550px] border border-[#1A1A1C] leading-relaxed">
            {JSON.stringify(json, null, 2)}
          </pre>
        )}
      </div>

      <div className="bg-[#0D0D0E] border-t border-[#222] px-6 py-3.5 text-xs text-slate-500 flex justify-between items-center">
        <span>Structure fully compliant with database directives</span>
        <span className="font-mono text-slate-600">Lines: {editValue.split("\n").length}</span>
      </div>

    </div>
  );
}
