import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const statuses = [
    "Reading Context...",
    "Neural Analysis...",
    "Extracting Key Insights...",
    "Filtering Noise...",
    "Crafting Summary...",
    "Polishing Details...",
    "Finalizing Result..."
];

export default function SummarizingLoader() {
    const [statusIndex, setStatusIndex] = useState(0);

    // Rotate status messages for a lively feel
    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIndex(prev => (prev + 1) % statuses.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-10 h-full min-h-[400px] animate-fade-in">
            <div className="relative mb-12">
                {/* Loader Container */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Single Clean Revolving Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="absolute inset-0 border-[3px] border-slate-100 dark:border-slate-800 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="absolute inset-0 border-t-[3px] border-emerald-500 rounded-full z-10"
                    />

                    {/* Central Brand Logo "S" */}
                    <div className="relative w-16 h-16 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center shadow-2xl z-20 border-2 border-white dark:border-slate-900">
                        <span className="text-2xl font-black text-white dark:text-slate-900 select-none">S</span>
                    </div>
                </div>
            </div>

            {/* Status Text Area */}
            <div className="text-center space-y-4 max-w-sm">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={statusIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center"
                    >
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {statuses[statusIndex]}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                            Processing with AI Intelligence
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Animated Activity Bar */}
                <div className="flex justify-center items-center gap-1.5 h-6">
                    {[0, 1, 2, 3, 4].map(i => (
                        <motion.div
                            key={i}
                            animate={{
                                height: [6, 16, 6],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1,
                                delay: i * 0.15
                            }}
                            className="w-1 bg-emerald-500 rounded-full"
                        />
                    ))}
                </div>
            </div>

            {/* Premium Label */}
            <div className="mt-12 px-5 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Neural Processing Active
                </p>
            </div>
        </div>
    );
}
