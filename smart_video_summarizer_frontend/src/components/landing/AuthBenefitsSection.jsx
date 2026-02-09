import React from 'react';
import { motion } from 'framer-motion';
import { FaVideo, FaHistory, FaFilm, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const BenefitCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{
            y: -12,
            scale: 1.05,
            transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        transition={{ duration: 0.5, delay }}
        className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-900/20 dark:hover:shadow-white/5 hover:border-slate-800 dark:hover:border-slate-600 transition-shadow transition-colors duration-200 group relative"
    >
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-900 dark:group-hover:bg-white transition-colors duration-300 shadow-sm">
            <Icon className="text-2xl text-slate-800 dark:text-slate-200 group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:scale-105 transition-transform">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300">{description}</p>
    </motion.div>
);

export default function AuthBenefitsSection({ onOpenAuth }) {
    const benefits = [
        {
            icon: FaVideo,
            title: "Video Summarization",
            description: "Don't just read—watch less and learn more. Paste any YouTube URL to get instant summaries."
        },
        {
            icon: FaFilm,
            title: "Smart Highlights",
            description: "Automatically extract viral-worthy clips and key moments from long videos."
        },
        {
            icon: FaHistory,
            title: "History & Export",
            description: "Never lose an insight. Save all your summaries automatically and export them to PDF or Word."
        }
    ];

    return (
        <section className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">

                    {/* Left Side: Text & CTA */}
                    <div className="md:w-1/3 text-center md:text-left">
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="text-black dark:text-white font-bold tracking-wider uppercase text-xs mb-3 block"
                        >
                            Unlock More
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight"
                        >
                            Get the Full Experience
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 dark:text-slate-400 mb-8"
                        >
                            Sign in to access advanced AI features designed to supercharge your productivity.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <button
                                onClick={onOpenAuth}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:bg-black dark:hover:bg-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all"
                            >
                                Signup / Login Free <FaArrowRight />
                            </button>
                        </motion.div>
                    </div>

                    {/* Right Side: Cards Grid */}
                    <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((b, idx) => (
                            <BenefitCard key={idx} {...b} delay={0.2 + (idx * 0.1)} />
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
