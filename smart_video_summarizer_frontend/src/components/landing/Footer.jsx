import React from 'react';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 py-16 relative overflow-hidden transition-colors">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-slate-50 dark:bg-slate-900/20 rounded-full blur-3xl -z-10 opacity-50 transition-colors" />

            <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">

                {/* Brand */}
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
                        Smart AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-400 dark:to-white">Summarizer</span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">
                        Transforming content into clarity.
                    </p>
                </div>

                {/* Links */}
                <div className="flex gap-4">
                    {[
                        { icon: FaGithub, href: "#" },
                        { icon: FaTwitter, href: "#" },
                        { icon: FaLinkedin, href: "#" }
                    ].map((item, index) => (
                        <a
                            key={index}
                            href={item.href}
                            className="w-10 h-10 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white dark:hover:text-slate-900 hover:bg-slate-900 dark:hover:bg-white hover:border-slate-900 dark:hover:border-white transition-all duration-300 hover:scale-110 hover:-translate-y-1 shadow-sm hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/10"
                        >
                            <item.icon size={18} />
                        </a>
                    ))}
                </div>

                {/* Copyright */}
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    &copy; {new Date().getFullYear()} Smart AI Inc.
                </div>
            </div>
        </footer>
    );
}
