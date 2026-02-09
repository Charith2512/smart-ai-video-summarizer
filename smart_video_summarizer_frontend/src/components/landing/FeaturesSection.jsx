import React from 'react';
import { motion } from 'framer-motion';
import { FaLayerGroup, FaListUl, FaHistory, FaFileAlt, FaVideo, FaFilePdf } from 'react-icons/fa';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        variants={item}
        whileHover={{
            y: -12,
            scale: 1.03,
            transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-900/20 dark:hover:shadow-white/5 hover:border-slate-800 dark:hover:border-slate-700 transition-shadow transition-colors duration-200 cursor-default group relative overflow-hidden"
    >
        <div className="absolute top-0 left-0 w-1 h-0 bg-slate-900 dark:bg-indigo-500 group-hover:h-full transition-all duration-500 ease-out" />

        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:bg-slate-900 dark:group-hover:bg-slate-800 transition-colors duration-300 group-hover:shadow-lg group-hover:shadow-slate-900/20 dark:group-hover:shadow-white/10">
            <Icon className="text-xl text-slate-800 dark:text-slate-200 group-hover:text-white dark:group-hover:text-indigo-400 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:translate-x-1 transition-transform duration-300">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{description}</p>
    </motion.div>
);

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
};

export default function FeaturesSection() {
    const features = [
        {
            icon: FaFileAlt,
            title: "Paragraph Summaries",
            description: "Condense lengthy articles into clear, readable paragraphs that retain the core message and flow."
        },
        {
            icon: FaListUl,
            title: "Bullet Points",
            description: "Extract key takeaways formatted as concise bullet points, perfect for quick skimming and notes."
        },
        {
            icon: FaHistory,
            title: "Smart History Library",
            description: "Automatically save your work. Revisit past summaries, track your reading journey, and download insights anytime."
        },
        {
            icon: FaFilePdf,
            title: "Document Support",
            description: "Upload PDF research papers or reports and get instant insights without reading the entire file."
        },
        {
            icon: FaVideo,
            title: "Video Intelligence",
            description: "Paste a YouTube link to get a full transcript summary or key video highlights in seconds."
        }
    ];

    return (
        <section id="features" className="py-20 bg-slate-50 dark:bg-slate-950/30 relative overflow-hidden transition-colors">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-black dark:text-white font-bold tracking-wider uppercase text-xs mb-3 block"
                    >
                        Features
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-6"
                    >
                        Tailor Your Content with AI
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 dark:text-slate-400 text-lg"
                    >
                        Summarize content effortlessly with our intelligent tools—choose your format, length, and style at no cost.
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {features.map((f, idx) => (
                        <FeatureCard key={idx} {...f} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
