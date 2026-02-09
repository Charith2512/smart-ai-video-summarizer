import React from 'react';
import { motion } from 'framer-motion';
import { FaPaste, FaCogs, FaMagic } from 'react-icons/fa';

const StepCard = ({ icon: Icon, step, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="relative flex flex-col items-center text-center p-10 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md rounded-[3rem] transition-all group"
    >
        {/* Step Number Badge */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-slate-900 dark:bg-slate-800 text-white dark:text-white border border-transparent dark:border-slate-700/50 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform transition-colors">
            {step}
        </div>

        <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-slate-700 transition-all duration-300 shadow-inner">
            <Icon className="text-3xl text-indigo-600 dark:text-indigo-400" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>


    </motion.div>
);

export default function HowItWorksSection() {
    return (
        <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-b from-transparent via-slate-50/50 dark:via-slate-900/20 to-transparent -z-10 pointer-events-none" />

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="inline-block py-1 px-3 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-4 border border-indigo-100 dark:border-indigo-800"
                    >
                        Simple Process
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                    >
                        How to Summarize Text
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Get concise, accurate summaries in three easy steps. No complex setup required.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative px-4">


                    <StepCard
                        step={1}
                        icon={FaPaste}
                        title="Input Content"
                        description="Paste your text, upload a PDF document, or simply enter a YouTube video URL."
                        delay={0.2}
                    />
                    <StepCard
                        step={2}
                        icon={FaCogs}
                        title="Customize Summary"
                        description="Choose your preferred summary length (Overview, Moderate, Detailed) and format style."
                        delay={0.4}
                    />
                    <StepCard
                        step={3}
                        icon={FaMagic}
                        title="Get Insights"
                        description="Our AI emphasizes key points and generates a structured summary instantly."
                        delay={0.6}
                    />
                </div>
            </div>
        </section>
    );
}
