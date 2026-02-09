import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaUserCircle, FaSignOutAlt, FaHistory, FaSun, FaMoon } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onOpenAuth, onOpenSignOut }) {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useUI();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();

    function handleLogout() {
        setDropdownOpen(false);
        if (onOpenSignOut) {
            onOpenSignOut();
        } else {
            // Fallback if no confirm modal is provided
            logout();
        }
    }

    return (
        <nav className="w-full relative z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="w-full flex justify-between items-center py-4 px-10 relative h-20">
                {/* Left: Logo & Theme Toggle */}
                <div className="flex items-center gap-6 relative z-20">
                    <Link to="/" className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <motion.span
                            whileHover={{ rotate: 180, scale: 1.2 }}
                            transition={{ duration: 0.5 }}
                            className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 text-lg shadow-lg shadow-slate-900/20 dark:shadow-white/10"
                        >
                            S
                        </motion.span>
                        <span className="tracking-tight">Smart AI</span>
                    </Link>

                    {/* Theme Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleTheme();
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={theme}
                                initial={{ y: 20, opacity: 0, rotate: -45 }}
                                animate={{ y: 0, opacity: 1, rotate: 0 }}
                                exit={{ y: -20, opacity: 0, rotate: 45 }}
                                transition={{ duration: 0.2 }}
                            >
                                {theme === 'dark' ? <FaSun className="text-yellow-400 text-lg" /> : <FaMoon className="text-slate-600 text-lg" />}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Center: Navigation Links - Absolute Centering relative to viewport */}
                <div className="absolute inset-x-0 flex justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, staggerChildren: 0.1 }}
                        className="hidden md:flex items-center gap-10 pointer-events-auto"
                    >
                        {['Features', 'Use Cases', 'FAQ'].map((item) => (
                            <motion.a
                                key={item}
                                href={`#${item.toLowerCase().replace(' ', '-')}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                whileHover={{ scale: 1.1, y: -2 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors text-[17px] relative group px-2 py-1"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-1 bg-slate-900 dark:bg-white rounded-full transition-all duration-300 group-hover:w-full"></span>
                            </motion.a>
                        ))}
                    </motion.div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-6 relative z-20">
                    {currentUser ? (
                        <>
                            <motion.div whileHover={{ scale: 1.05, y: -2 }}>
                                <Link to="/history" className="text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold transition-colors text-sm flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-full border border-transparent dark:border-slate-700">
                                    <FaHistory /> My History
                                </Link>
                            </motion.div>

                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-1.5 pl-4 pr-1.5 shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5 group hover:border-slate-300 dark:hover:border-slate-700"
                                >
                                    <div className="flex flex-col text-right mr-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-tight tracking-wider">Account</span>
                                        <span className="hidden sm:inline text-sm text-slate-800 dark:text-slate-200 font-bold tracking-tight group-hover:text-slate-900 dark:group-hover:text-white">{currentUser.email?.split('@')[0]}</span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white flex items-center justify-center text-white dark:text-slate-900 shadow-md group-hover:scale-105 transition-transform duration-300">
                                        <span className="font-bold text-lg">{currentUser.email?.charAt(0).toUpperCase()}</span>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {dropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-4 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
                                        >
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                                            >
                                                <FaSignOutAlt /> Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="relative"
                        >
                            <motion.div
                                whileHover={{
                                    y: -4,
                                    scale: 1.05,
                                    transition: { type: "spring", stiffness: 400, damping: 10 }
                                }}
                                className="px-6 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-white hover:shadow-lg hover:shadow-slate-900/20 dark:hover:shadow-white/10 transition-colors duration-300"
                            >
                                Sign In
                            </motion.div>
                        </button>
                    )
                    }
                </div>
            </div>
        </nav>
    );
}
