import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden mb-4 transition-all hover:border-black dark:hover:border-white">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex justify-between items-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
                <span className="font-bold text-slate-800 dark:text-white text-sm md:text-base pr-4">{question}</span>
                <span className={`text-black dark:text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <FaChevronDown />
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="px-6 pb-6 text-slate-500 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-50 dark:border-slate-800 mt-2 pt-4">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function FAQSection() {
    const faqs = [
        {
            question: "What does this summarizing tool do?",
            answer: "Our tool simplifies lengthy text, PDFs, or videos into concise summaries, preserving key ideas. It helps you save time and extract essential information quickly."
        },
        {
            question: "What is the character limit for the text I can summarize?",
            answer: "Currently, our free version supports up to 50,000 characters per summary. For larger documents or videos, we automatically process them in chunks to ensure accuracy."
        },

        {
            question: "What types of content can I summarize?",
            answer: "You can summarize plain text, PDF documents (research papers, reports), and YouTube videos (via URL)."
        },
        {
            question: "Is the summary guaranteed to include all main points?",
            answer: "While our AI is highly advanced, it focuses on the most statistically significant and semantically relevant points. We recommend reviewing the full text for critical legal or medical documents."
        },
        {
            question: "Can I save my summaries for later?",
            answer: "Absolutely! Every summary you generate is automatically saved to your 'Smart History' library. You can revisit, organize, and export your previous work at any time."
        }
    ];

    return (
        <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-950/50 relative transition-colors">
            <div className="container mx-auto px-4 max-w-3xl relative z-10">
                <div className="text-center mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4"
                    >
                        Everything You Need to Know
                    </motion.h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Common questions about our AI summarizer.
                    </p>
                </div>

                <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                        <FAQItem key={idx} {...faq} />
                    ))}
                </div>
            </div>
        </section>
    );
}
