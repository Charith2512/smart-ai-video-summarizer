import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignOutAlt, FaExclamationTriangle } from 'react-icons/fa';

export default function SignOutConfirmModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-all"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-[40px] pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none" />

                    <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400 text-2xl mx-auto mb-6 shadow-lg shadow-red-500/10">
                            <FaExclamationTriangle />
                        </div>

                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                            Sign Out?
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                            Are you sure you want to sign out? You'll need to sign back in to access your saved summaries.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Stay
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="flex-1 px-6 py-4 rounded-2xl bg-red-500 dark:bg-red-600 text-white font-bold hover:bg-red-600 dark:hover:bg-red-700 shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <FaSignOutAlt /> Sign Out
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
