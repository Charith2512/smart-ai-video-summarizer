import React, { useState } from 'react';
import { motion } from 'framer-motion';

const InputSection = ({
  inputType,
  summaryLength,
  setSummaryLength,
  highlights,
  setHighlights,
  formatMode,
  setFormatMode,
  onSummarize,
  onTextChange,
  url,
  setUrl,
  file,
  setFile,
  fileName, // New prop for PDF restoration
  isLoading,
  onStop
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-center transition-all duration-300 min-h-0">

        {/* SAME URL INPUT FOR VIDEO & HIGHLIGHTS */}
        {(inputType === 'video' || inputType === 'highlights') && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-800/60 rounded-2xl p-3 focus-within:ring-4 focus-within:ring-slate-900/5 dark:focus-within:ring-white/5 transition-all shadow-sm">
              <input
                type="text"
                placeholder={inputType === 'highlights' ? 'Paste YouTube URL for Highlights...' : 'Paste YouTube Video URL...'}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent border-none px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-lg font-medium caret-slate-900 dark:caret-white"
              />
            </div>
          </div>
        )}

        {/* PDF INPUT */}
        {inputType === 'pdf' && (
          <div className="space-y-4 animate-fade-in">
            <div
              className={`rounded-[2.5rem] p-10 text-center transition-all duration-300 cursor-pointer group backdrop-blur-md border ${isDragging || file ? 'border-slate-900 dark:border-white bg-slate-50/20 dark:bg-slate-900/50 shadow-2xl shadow-slate-900/10' : 'border-white/60 dark:border-slate-800/60 bg-white/10 dark:bg-slate-900/20 hover:bg-white/20 dark:hover:bg-slate-900/30 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input type="file" id="pdf-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
              <label htmlFor="pdf-upload" className="cursor-pointer block w-full h-full">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${file || fileName ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-white/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:scale-110 duration-300'}`}>
                  <span className="text-3xl">📄</span>
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-2">
                  {file ? file.name : fileName ? `Restored: ${fileName}` : "Drop PDF here"}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">or click to browse</p>
              </label>
            </div>
          </div>
        )}

        {/* TEXT INPUT */}
        {inputType === 'text' && (
          <div className="animate-fade-in">
            <textarea
              placeholder="Paste your text here to summarize..."
              value={url} // Use url prop (which holds text content in text mode)
              onChange={(e) => {
                setUrl(e.target.value); // Update parent state directly
                if (onTextChange) onTextChange(e.target.value);
              }}
              className="w-full h-80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-slate-800/60 rounded-[2rem] p-8 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 transition-all resize-none text-lg leading-relaxed shadow-inner caret-slate-900 dark:caret-white"
            ></textarea>
          </div>
        )}
      </div>

      {/* OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
        {(inputType !== 'video' && inputType !== 'highlights') && (
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Summary Length</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
              {['short', 'medium', 'long'].map(len => (
                <button
                  key={len}
                  onClick={() => setSummaryLength(len)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all relative z-10 ${summaryLength === len ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  {summaryLength === len && (
                    <motion.div
                      layoutId="activeLength"
                      className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 z-[-1]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{len}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(inputType !== 'highlights') && (
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Summary Format</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
              {['paragraph', 'bullet points'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFormatMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all relative z-10 ${formatMode === mode ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  {formatMode === mode && (
                    <motion.div
                      layoutId="activeFormat"
                      className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 z-[-1]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{mode}</span>
                </button>
              ))}
            </div>
          </div>
        )}


      </div>

      <button
        onClick={isLoading ? onStop : () => onSummarize({ text: url, url, file })}
        className={`w-full font-bold py-4 rounded-xl shadow-lg transform transition-all duration-300 ${isLoading
          ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
          : "bg-slate-900 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/20 dark:shadow-white/10 hover:shadow-slate-900/40 hover:scale-[1.02] active:scale-[0.98]"
          }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            ⏹️ Stop Generating
          </span>
        ) : (
          "✨ Summarize Content"
        )}
      </button>
    </div>
  );
};

export default InputSection;
