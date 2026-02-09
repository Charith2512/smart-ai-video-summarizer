import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaBolt, FaBrain, FaLayerGroup, FaCheck } from 'react-icons/fa';

const FeatureCard = ({ icon: Icon, title, description, benefits, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-white/5 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-1 relative overflow-hidden group"
    >
        {/* Gradient Blob Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-slate-800 rounded-full blur-[60px] group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/20 transition-colors pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-6 shadow-lg shadow-slate-900/20 dark:shadow-white/10 group-hover:scale-110 transition-transform duration-300">
            <Icon className="text-2xl" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{description}</p>

        <div className="space-y-3">
            {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs transition-colors">
                        <FaCheck />
                    </div>
                    {benefit}
                </div>
            ))}
        </div>
    </motion.div>
);

export default function WhyChooseUsSection() {
    const features = [
        {
            icon: FaBrain,
            title: "Context-Aware Intelligence",
            description: "Unlike basic summarizers that just pick sentences, our AI understands context, nuance, and tone.",
            benefits: ["Identify Key Themes", "Preserve Original Tone", "No Important Details Lost"]
        },
        {
            icon: FaLayerGroup,
            title: "Universal Support",
            description: "One platform for all your content needs. Seamlessly summarize text, documents, and videos.",
            benefits: ["Text & Articles", "PDF Research Papers", "YouTube Videos"]
        },
        {
            icon: FaBolt,
            title: "Lightning Fast",
            description: "Process hours of video or hundreds of pages in seconds, saving you valuable time.",
            benefits: ["Real-time Processing", "Instant Export", "Bulk Actions"]
        },
        {
            icon: FaShieldAlt,
            title: "Private & Secure",
            description: "Your data is processed securely and never shared. We prioritize your privacy above all.",
            benefits: ["Encrypted Processing", "No Data Selling", "Auto-Delete History"]
        }
    ];

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm mb-6 transition-colors"
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest transition-colors">Why We Are The Best</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                        Why Our Summarizer Is <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Unbeatable</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-3xl mx-auto transition-colors">
                        We combine cutting-edge AI models with a premium user experience to deliver the most accurate summaries on the web.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => (
                        <FeatureCard key={idx} {...feature} delay={0.2 + (idx * 0.1)} />
                    ))}
                </div>
            </div>
        </section>
    );
}
