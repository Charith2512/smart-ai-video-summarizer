import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaHistory, FaSignOutAlt, FaCog, FaQuestionCircle, FaChevronLeft, FaChevronRight, FaBars } from 'react-icons/fa';

export default function Sidebar({ isOpen, onToggle }) {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchHistory();
        }
    }, [currentUser]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8000/history/${currentUser.uid}`);
            if (response.ok) {
                const data = await response.json();
                // Sort by date descending
                setHistory(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        navigate('/', { state: { reset: true } });
        if (window.innerWidth < 768) onToggle(false);
    };

    const handleSelectHistory = (item) => {
        navigate('/', {
            state: {
                url: item.url,
                summary: item.summary_output,
                highlights: item.highlights ? JSON.parse(item.highlights) : null,
                inputType: item.input_type,
                title: item.title || item.input_content?.substring(0, 30)
            }
        });
        if (window.innerWidth < 768) onToggle(false);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    if (!currentUser) return null;

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onToggle(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: isOpen ? '280px' : '0px',
                    x: window.innerWidth >= 768 ? 0 : (isOpen ? 0 : -280) // Desktop: always x=0 (width handles it), Mobile: slide x
                }}
                className={`fixed md:relative top-0 left-0 h-full bg-[#f8fafc] dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-2xl md:shadow-none font-sans`}
            >
                {/* Header / New Chat */}
                <div className="p-4 pt-6 min-w-[280px]"> {/* Ensure internal content doesn't wrap during shrink */}
                    <div className="flex items-center justify-between mb-6 px-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm transition-colors">S</div>
                            <span className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">Smart AI</span>
                        </div>
                        <button
                            onClick={() => onToggle(false)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all hover:text-slate-700 dark:hover:text-slate-200 hover:rotate-180"
                        >
                            <FaBars size={16} />
                        </button>
                    </div>

                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:shadow-md dark:hover:shadow-white/5 group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaPlus size={14} />
                        </div>
                        <span className="text-sm">New summary</span>
                    </button>

                    <button
                        onClick={() => {
                            navigate('/history');
                            if (window.innerWidth < 768) onToggle(false);
                        }}
                        className="w-full mt-2 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:shadow-md dark:hover:shadow-white/5 group"
                    >
                        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FaHistory size={14} />
                        </div>
                        <span className="text-sm">All summaries</span>
                    </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
                    <div className="mt-6 mb-4 px-4">
                        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recent Activity</h3>
                    </div>

                    <div className="space-y-1">
                        {loading ? (
                            <div className="px-4 py-2 space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : history.length > 0 ? (
                            history.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelectHistory(item)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 transition-all text-sm group text-left relative overflow-hidden"
                                >
                                    <span className="shrink-0 opacity-50 group-hover:opacity-100">
                                        {item.input_type === 'video' ? '📺' : item.input_type === 'pdf' ? '📄' : '📝'}
                                    </span>
                                    <span className="truncate flex-1 font-medium">
                                        {item.title || item.input_content?.substring(0, 40) || 'Previous Summary'}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                                Your summary history will appear here.
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 bg-white/50 dark:bg-slate-950/50">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-sm font-medium">
                        <FaCog className="opacity-50" /> Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all text-sm font-medium">
                        <FaQuestionCircle className="opacity-50" /> Help & Support
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-bold"
                    >
                        <FaSignOutAlt className="opacity-70" /> Sign Out
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
