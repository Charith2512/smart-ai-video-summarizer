import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';

export default function SuccessModal({ isOpen, onClose, message }) {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-hidden pointer-events-none">
                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 50 }}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 px-10 py-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5 flex items-center gap-6 pointer-events-auto"
                >
                    {/* Decorative Green Glow */}
                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />

                    <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 text-3xl">
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.1 }}
                        >
                            <FaCheckCircle />
                        </motion.div>
                    </div>

                    <div className="text-left">
                        <h4 className="text-slate-900 dark:text-white font-black tracking-tight text-xl">Success!</h4>
                        <p className="text-slate-500 dark:text-emerald-400/80 font-bold text-sm tracking-wide lowercase-first">
                            {message}
                        </p>
                    </div>

                    {/* Simple Particle Effect */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                                x: (i - 2) * 20,
                                y: -40 - (i % 2) * 20
                            }}
                            transition={{ duration: 1.0, delay: 0.2 + (i * 0.1), repeat: Infinity }}
                            className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full"
                            style={{ left: '50%' }}
                        />
                    ))}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
