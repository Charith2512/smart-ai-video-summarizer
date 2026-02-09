import React from 'react';
import { motion } from 'framer-motion';
import { FaUserGraduate, FaLaptopCode, FaBullhorn, FaBriefcase, FaPenNib, FaChalkboardTeacher } from 'react-icons/fa';

const PersonaCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        variants={item}
        whileHover={{
            y: -16,
            scale: 1.05,
            transition: { type: "spring", stiffness: 400, damping: 25 }
        }}
        className="text-center p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-slate-900/20 dark:hover:shadow-white/5 hover:border-black dark:hover:border-slate-700 transition-shadow transition-colors duration-200 group relative"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 dark:from-slate-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl -z-10" />

        <div className="w-16 h-16 mx-auto rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-slate-900 dark:group-hover:bg-slate-700 transition-colors duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-inner">
            <Icon className="text-2xl text-slate-400 group-hover:text-white dark:group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:scale-105 transition-transform duration-300 origin-center">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors uppercase-first">{description}</p>
    </motion.div>
);

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 40 } }
};

export default function UseCasesSection() {
    const personas = [
        {
            icon: FaUserGraduate,
            title: "Students",
            description: "Summarize research papers and lecture notes instantly, and keep a searchable history of your readings for exam revision."
        },
        {
            icon: FaBriefcase,
            title: "Product Managers",
            description: "Simplify market research, share clear updates with stakeholders, and maintain an archive of competitive insights."
        },
        {
            icon: FaBullhorn,
            title: "Marketers",
            description: "Generate ideas for blogs or campaigns by quickly distilling trending long-form content."
        },
        {
            icon: FaLaptopCode,
            title: "Engineers",
            description: "Summarize technical documentation and complex specs for better collaboration."
        }
    ];

    return (
        <section id="use-cases" className="py-24 bg-white dark:bg-slate-950 transition-colors relative">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-black dark:text-white font-bold tracking-wider uppercase text-xs mb-3 block"
                    >
                        Use Cases
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-6"
                    >
                        Who is Smart AI Summarizer For?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 dark:text-slate-400 text-lg"
                    >
                        From students to CEOs, our tool helps anyone save time and boost productivity.
                    </motion.p>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {personas.map((p, idx) => (
                        <PersonaCard key={idx} {...p} />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
