import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getYouTubeID, getThumbnailUrl } from '../utils/youtube';

export default function History() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedSummary, setSelectedSummary] = useState(null);
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [statsSelection, setStatsSelection] = useState(null);

    const [itemToDelete, setItemToDelete] = useState(null);
    const [isClearingAll, setIsClearingAll] = useState(false);

    // Full View State (Consolidated)
    const [isCopied, setIsCopied] = useState(false);
    const [isSummaryCopied, setIsSummaryCopied] = useState(false);
    const [comparisonCopiedState, setComparisonCopiedState] = useState({ short: false, medium: false, long: false });
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [selectedComparisonSet, setSelectedComparisonSet] = useState(null);

    // Batch Delete State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

    const handleCopyInput = async () => {
        if (selectedSummary?.input_content) {
            try {
                await navigator.clipboard.writeText(selectedSummary.input_content);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }
    };

    const handleCopySummary = async () => {
        if (selectedSummary?.summary_output) {
            try {
                await navigator.clipboard.writeText(selectedSummary.summary_output);
                setIsSummaryCopied(true);
                setTimeout(() => setIsSummaryCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy summary:", err);
            }
        }
    };

    const handleCopyComparison = async (text, type) => {
        if (text) {
            try {
                await navigator.clipboard.writeText(text);
                setComparisonCopiedState(prev => ({ ...prev, [type]: true }));
                setTimeout(() => {
                    setComparisonCopiedState(prev => ({ ...prev, [type]: false }));
                }, 2000);
            } catch (err) {
                console.error("Failed to copy comparison text:", err);
            }
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchHistory();
        }
    }, [currentUser]);

    // Body Scroll Lock for Modals
    useEffect(() => {
        const isModalOpen = selectedSummary || statsSelection || showComparisonModal || itemToDelete || isClearingAll || showConfirmDeleteModal;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedSummary, statsSelection, showComparisonModal, itemToDelete, isClearingAll, showConfirmDeleteModal]);

    const fetchHistory = async () => {
        try {
            // Use Firebase User ID to fetch history
            const response = await fetch(`http://localhost:8000/history/${currentUser.uid}`);
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBySearch = history.filter(item => {
        const searchContent = `${item.original_filename || ''} ${item.input_content || ''}`.toLowerCase();
        return searchContent.includes(searchTerm.toLowerCase());
    });

    const filteredHistory = filter === 'all'
        ? filteredBySearch
        : filter === 'compare'
            ? [] // Handled separately
            : filter === 'highlights'
                ? filteredBySearch.filter(item => item.highlights && item.highlights !== "null")
                : filteredBySearch.filter(item => item.input_type === filter);

    // Grouping Logic for Comparison
    const comparisonSets = filteredBySearch.reduce((acc, item) => {
        if (!item.content_hash) return acc;
        if (!acc[item.content_hash]) {
            acc[item.content_hash] = {
                items: [],
                types: new Set(),
                baseItem: item
            };
        }
        acc[item.content_hash].items.push(item);
        if (item.preference) acc[item.content_hash].types.add(item.preference);
        return acc;
    }, {});

    const validComparisonSets = Object.values(comparisonSets).filter(set =>
        set.types.has('short') && set.types.has('medium') && set.types.has('long')
    );

    const handleOpenFile = (item) => {
        if (item.file_path) {
            window.open(`http://localhost:8000/${item.file_path}`, '_blank');
        } else {
            alert("File not available for this summary.");
        }
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
    };

    const handleClearAll = () => {
        setIsClearingAll(true);
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedItems(new Set());
    };

    const toggleItemSelection = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleBatchDelete = async () => {
        if (selectedItems.size === 0) return;
        setShowConfirmDeleteModal(true);
    };

    const confirmBatchDelete = async () => {
        try {
            // Optimistic UI update
            const itemsToDelete = Array.from(selectedItems);
            setHistory(prev => prev.filter(item => !itemsToDelete.includes(item.id)));

            // Send requests in parallel (or use a batch endpoint if available, looping here for now)
            await Promise.all(itemsToDelete.map(id =>
                fetch(`http://localhost:8000/history/${id}`, { method: 'DELETE' })
            ));

            setIsSelectionMode(false);
            setSelectedItems(new Set());
            setShowConfirmDeleteModal(false);
        } catch (error) {
            console.error("Batch delete failed:", error);
            alert("Some items failed to delete.");
            fetchHistory(); // Revert on failure
        }
    };


    const executeDelete = async () => {
        try {
            if (isClearingAll) {
                const response = await fetch(`http://localhost:8000/history/clear/${currentUser.uid}?filter_type=${filter}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    // Refresh history instead of just clearing local state (since we might have only cleared a subset)
                    fetchHistory();
                }
            } else if (itemToDelete) {
                const response = await fetch(`http://localhost:8000/history/${itemToDelete}`, {
                    method: 'DELETE'
                });
                if (response.ok) setHistory(prev => prev.filter(item => item.id !== itemToDelete));
            }
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete item.");
        } finally {
            setItemToDelete(null);
            setIsClearingAll(false);
        }
    };

    const handleViewOnHomepage = (item) => {
        try {
            console.log("Navigating to Home with state:", item);
            let highlightsData = null;
            if (item.highlights && item.highlights !== "null") {
                try {
                    highlightsData = JSON.parse(item.highlights);
                } catch (e) {
                    console.error("Failed to parse highlights:", e);
                }
            }

            navigate('/', {
                state: {
                    url: item.input_content,
                    summary: item.summary_output,
                    highlights: highlightsData,
                    inputType: item.input_type,
                    fileName: item.original_filename,
                    videoTitle: item.original_filename, // Pass title for post-summary card display
                    inputStats: {
                        words: item.orig_words,
                        sentences: item.orig_sentences,
                        chars: item.orig_chars
                    },
                    outputStats: {
                        words: item.summ_words,
                        sentences: item.summ_sentences,
                        chars: item.summ_chars
                    },
                    availableQualities: (() => {
                        if (!item.available_qualities) return ['720p'];
                        try {
                            const parsed = JSON.parse(item.available_qualities);
                            return Array.isArray(parsed) ? parsed : item.available_qualities.split(',');
                        } catch (e) {
                            return item.available_qualities.split(',');
                        }
                    })()
                }
            });
        } catch (error) {
            console.error("Navigation error:", error);
            alert("Failed to load summary. Check console for details.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative transition-colors duration-300">
            {/* Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-40 dark:opacity-0 transition-opacity duration-300">
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }} />
            </div>

            {/* Dark Mode Background */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-0 dark:opacity-30 transition-opacity duration-300">
                <div className="absolute top-[20%] right-[20%] w-[600px] h-[600px] bg-slate-800/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-[120px]" />
            </div>

            <Navbar />

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl -mx-6 px-6 pt-6 pb-6 mb-8 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
                    <header>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">My Activity</h1>
                                <p className="text-slate-500 dark:text-slate-300 font-medium text-sm">Manage your saved summaries and insights.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* Search Bar */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-slate-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search history..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium w-full sm:w-64 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm group-hover:shadow-md dark:text-white"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800">
                                    {['all', 'text', 'pdf', 'video', 'highlights', 'compare'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilter(type)}
                                            className={`relative px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300 z-10 ${filter === type ? 'text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                        >
                                            {filter === type && (
                                                <motion.div
                                                    layoutId="activeFilter"
                                                    className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-xl -z-10"
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            )}
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Selection Counter & Manage Selection - NOW AT TOP */}
                        {history.length > 0 && (
                            <div className="mt-8">
                                <div className="mt-8 flex justify-between items-center min-h-[48px]">
                                    <div className="flex-1">
                                        <AnimatePresence>
                                            {isSelectionMode && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex items-center gap-3"
                                                >
                                                    {/* Selection tools detached on the left */}
                                                    <div className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                                                        <span>{selectedItems.size}</span>
                                                        <span className="opacity-80 uppercase tracking-tighter">Selected</span>
                                                    </div>

                                                    <div className="flex h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 shadow-sm">
                                                        <button
                                                            onClick={() => {
                                                                const allIds = filteredHistory.map(item => item.id);
                                                                setSelectedItems(new Set(allIds));
                                                            }}
                                                            className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                                                        >
                                                            Select All
                                                        </button>
                                                        <div className="w-px bg-slate-100 dark:bg-slate-800 mx-1" />
                                                        <button
                                                            onClick={() => setSelectedItems(new Set())}
                                                            className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                                                        >
                                                            Deselect
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={handleBatchDelete}
                                                        disabled={selectedItems.size === 0}
                                                        className={`h-10 px-5 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center gap-2 ${selectedItems.size > 0
                                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white shadow-sm active:scale-95'
                                                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed border border-slate-100 dark:border-slate-800'
                                                            }`}
                                                    >
                                                        <span>🗑️</span> Delete Selected
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <button
                                        onClick={toggleSelectionMode}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md border ${isSelectionMode
                                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-200'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {isSelectionMode ? (
                                            <>Exit Selection ✕</>
                                        ) : (
                                            <><span>✨</span> Manage Selection</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </header>
                </div>




                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading history...</div>
                ) : (searchTerm && filteredBySearch.length === 0) ? (
                    <div className="text-center py-32 bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-slate-200/20 dark:shadow-slate-950/40 border border-white/40 dark:border-slate-800/40">
                        <div className="text-6xl mb-6 opacity-30">🔍</div>
                        <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">No matching results</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            We couldn't find any summaries matching "<span className="text-indigo-600 dark:text-indigo-400 font-bold">{searchTerm}</span>".
                        </p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-32 bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-slate-200/20 dark:shadow-slate-950/40 border border-white/40 dark:border-slate-800/40">
                        <div className="text-6xl mb-6 opacity-30">📂</div>
                        <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Your history is empty</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Start summarizing content to see your activity here.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            Generate First Summary
                        </button>
                    </div>
                ) : filter === 'compare' ? (
                    validComparisonSets.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="text-6xl mb-4 grayscale opacity-50">⚖️</div>
                            <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">No Comparisons Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                {searchTerm ? "No comparison sets match your search." : "To unlock this feature, summarize the same content in all three modes: Short, Medium, and Long."}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-6 px-6 py-2 bg-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-200 transition-all"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {validComparisonSets.map((set, index) => {
                                const isSetSelected = set.items.every(item => selectedItems.has(item.id));
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                const newSelected = new Set(selectedItems);
                                                set.items.forEach(item => {
                                                    if (isSetSelected) newSelected.delete(item.id);
                                                    else newSelected.add(item.id);
                                                });
                                                setSelectedItems(newSelected);
                                            } else {
                                                setSelectedComparisonSet(set);
                                                setShowComparisonModal(true);
                                            }
                                        }}
                                        className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border rounded-[2.5rem] p-8 transition-all group relative cursor-pointer ${isSelectionMode && isSetSelected
                                            ? 'bg-indigo-50/90 dark:bg-indigo-900/30 border-indigo-500/50 ring-4 ring-indigo-500/10 shadow-2xl shadow-indigo-500/20 scale-[1.02]'
                                            : 'border-white/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/40 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-950/20 hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-slate-900/90 ring-1 ring-slate-900/5 dark:ring-white/5'
                                            }`}
                                    >
                                        {isSelectionMode && (
                                            <div className="absolute top-6 right-6 z-20">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSetSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white'}`}>
                                                    {isSetSelected && <span className="text-white text-xs">✓</span>}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-1">
                                                {['Short', 'Medium', 'Long'].map(t => (
                                                    <span key={t} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase text-slate-500 border border-slate-200 dark:border-slate-700">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                            {!isSelectionMode && <span className="text-2xl transition-transform group-hover:scale-125">⚖️</span>}
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2 truncate">
                                            {set.baseItem.original_filename || set.baseItem.input_content}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2">
                                            Complete set available. Compare detailed statistics and summaries side-by-side.
                                        </p>
                                        <button className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-tight shadow-sm transition-all ${isSelectionMode
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                            : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/20'
                                            }`}>
                                            {isSelectionMode ? (isSetSelected ? "Selected" : "Select Set") : "Compare All 3 Versions"}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredHistory.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => {
                                    if (isSelectionMode) {
                                        toggleItemSelection(item.id);
                                    } else {
                                        // If it's a highlights item (matches type or has highlights data), open Key Moments view
                                        if (item.input_type === 'highlights' || (item.highlights && item.highlights !== "null")) {
                                            setSelectedSummary({ ...item, showHighlights: true });
                                        } else {
                                            setSelectedSummary(item);
                                        }
                                    }
                                }}
                                className={`bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl transition-all group relative cursor-pointer rounded-[2.5rem] p-8 border ${isSelectionMode && selectedItems.has(item.id)
                                    ? 'bg-indigo-100/40 dark:bg-indigo-900/20 border-indigo-500/50 ring-4 ring-indigo-500/10 shadow-2xl shadow-indigo-500/10 scale-[1.01]'
                                    : 'border-white/40 dark:border-slate-800/40 shadow-xl shadow-slate-200/10 dark:shadow-slate-950/20 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:bg-white/40 dark:hover:bg-slate-900/40'
                                    }`}
                            >
                                {/* Selection Checkbox */}
                                {isSelectionMode && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedItems.has(item.id)
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-slate-500 bg-black/20'
                                            }`}>
                                            {selectedItems.has(item.id) && <span className="text-white text-xs">✓</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Delete Button (Absolute Top Right) - Hide in selection mode */}
                                {!isSelectionMode && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors p-1"
                                        title="Delete"
                                    >
                                        ✕
                                    </button>
                                )}

                                <div className="flex justify-between items-start mb-4 pr-10">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (item.input_type === 'text') {
                                                    setSelectedSummary(item);
                                                    setIsComparisonMode(true);
                                                } else if (item.input_type === 'video') {
                                                    // Open YouTube Link
                                                    window.open(item.input_content, '_blank');
                                                } else {
                                                    handleOpenFile(item);
                                                }
                                            }}
                                            disabled={!item.file_path && item.input_type !== 'text' && item.input_type !== 'video'}
                                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-transform hover:scale-105 ${(!item.file_path && item.input_type !== 'text' && item.input_type !== 'video') ? 'opacity-50 cursor-not-allowed' : ''
                                                } ${item.input_type === 'pdf' ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' :
                                                    item.input_type === 'video' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100' :
                                                        'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 cursor-pointer'
                                                }`}
                                            title={
                                                item.input_type === 'text' ? "View Full Input Text" :
                                                    item.input_type === 'video' ? "Watch Video on YouTube" :
                                                        item.file_path ? "Open Original File" : "No file attached"
                                            }
                                        >
                                            {item.input_type} {item.input_type === 'video' || item.file_path ? "↗" : ""}
                                        </button>

                                        {/* Preference Badge */}
                                        {item.preference && (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                                {item.preference}
                                            </span>
                                        )}

                                        {/* Chart Icon */}
                                        {item.orig_words > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setStatsSelection(item); }}
                                                className="text-slate-500 hover:text-green-400 transition-colors p-1"
                                                title="View Statistics"
                                            >
                                                📊
                                            </button>
                                        )}

                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-lg mb-2 truncate text-slate-800 dark:text-white" title={item.original_filename || item.input_content}>
                                    {item.original_filename || item.input_content}
                                </h3>

                                {/* Highlights Badge & Button */}
                                {item.highlights && item.highlights !== "null" && (
                                    <div className="mb-4 flex flex-col gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSummary({ ...item, showHighlights: true });
                                            }}
                                            className="w-full py-2 bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 text-pink-300 hover:text-white hover:bg-pink-500/30 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 group"
                                        >
                                            <span className="group-hover:scale-110 transition-transform">✨</span> View {JSON.parse(item.highlights).length} Key Moments
                                        </button>

                                    </div>
                                )}

                                <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                                    {item.summary_output}
                                </div>

                                <div className="mt-auto flex justify-between items-center pt-2">
                                    {item.input_type !== 'highlights' ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSummary(item);
                                            }}
                                            className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline decoration-2 underline-offset-2"
                                        >
                                            View Full Summary
                                        </button>
                                    ) : (
                                        <div />
                                    )}

                                    {!isSelectionMode && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleViewOnHomepage(item); }}
                                            className="px-4 py-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase transition-all hover:bg-white/60 dark:hover:bg-slate-900/60 hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2"
                                        >
                                            <span>🏠</span> View in Homepage
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
                }
            </main >

            {/* Full Summary & Comparison Modal (Unified) */}
            {
                selectedSummary && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => {
                            setSelectedSummary(null);
                            setIsComparisonMode(false);
                        }}>
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full ${isComparisonMode ? 'max-w-6xl h-[85vh]' : 'max-w-2xl max-h-[80vh]'} flex flex-col shadow-2xl overflow-hidden transition-all duration-500 ease-in-out`}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <motion.div layout className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl flex-shrink-0">
                                <motion.div layout>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white truncate pr-4 max-w-md">
                                        {isComparisonMode ? "📝 Text Details & Summary" : selectedSummary.input_content}
                                    </h3>
                                    {isComparisonMode && (
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                            Compare your original input with the AI summary side-by-side.
                                        </p>
                                    )}
                                </motion.div>
                                <button
                                    onClick={() => {
                                        setSelectedSummary(null);
                                        setIsComparisonMode(false);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2"
                                >
                                    ✕
                                </button>
                            </motion.div>

                            {/* Modal Content */}
                            <motion.div layout className={`flex-1 min-h-0 ${isComparisonMode ? 'grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800' : 'overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-900'}`}>
                                <AnimatePresence mode="wait">
                                    {isComparisonMode ? (
                                        <>
                                            {/* Left Pane: Original Text */}
                                            <motion.div
                                                key="original"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex flex-col min-h-0 bg-slate-50/30 dark:bg-slate-900/40"
                                            >
                                                <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original Content</span>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white dark:bg-slate-950">
                                                    <div className="font-sans text-slate-700 dark:text-slate-300 leading-relaxed text-sm space-y-4">
                                                        {selectedSummary.input_content.split(/\n\s*\n/).map((paragraph, index) => (
                                                            <p key={index}>{paragraph}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Right Pane: Summary Content */}
                                            <motion.div
                                                key="summary-side"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex flex-col min-h-0"
                                            >
                                                <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">AI Summary</span>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-indigo-50/5 dark:bg-slate-950">
                                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed custom-markdown">
                                                        <ReactMarkdown
                                                            components={{
                                                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-3" {...props} />,
                                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-3 mb-2" {...props} />,
                                                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1" {...props} />,
                                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3 space-y-1" {...props} />,
                                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...props} />,
                                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                                            }}
                                                        >
                                                            {selectedSummary.summary_output}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </>
                                    ) : (
                                        <motion.div
                                            key="full-summary"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="w-full"
                                        >
                                            {selectedSummary.showHighlights ? (
                                                <div className="space-y-6">
                                                    {/* Video Context Header - Redesign for Impact */}
                                                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 dark:border-slate-800/60 shadow-xl mb-8 group hover:border-red-500/30 transition-all duration-500">
                                                        {/* Large Thumbnail */}
                                                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-200 dark:bg-slate-700 shadow-inner group-hover:shadow-2xl transition-all duration-500">
                                                            <img
                                                                src={`https://img.youtube.com/vi/${getYouTubeID(selectedSummary.input_content)}/maxresdefault.jpg`}
                                                                alt="Video Thumbnail"
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                onError={(e) => {
                                                                    e.target.src = `https://img.youtube.com/vi/${getYouTubeID(selectedSummary.input_content)}/mqdefault.jpg`;
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>

                                                        {/* Video Details */}
                                                        <div className="text-center">
                                                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 tracking-tight">
                                                                {selectedSummary.original_filename || "YouTube Video"}
                                                            </h4>
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 max-w-full">
                                                                <span className="text-[10px] uppercase font-black text-slate-400">Source URL</span>
                                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[300px]">
                                                                    {selectedSummary.input_content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                                        <h4 className="text-pink-600 dark:text-pink-400 font-black flex items-center gap-2 text-xs uppercase tracking-widest">
                                                            <span>✨</span> Key Moments Breakdown
                                                        </h4>
                                                    </div>
                                                    {(() => {
                                                        try {
                                                            const highlights = typeof selectedSummary.highlights === 'string'
                                                                ? JSON.parse(selectedSummary.highlights)
                                                                : selectedSummary.highlights;
                                                            return highlights.map((h, idx) => (
                                                                <div key={idx} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-[1.5rem] border border-white/60 dark:border-slate-800/60 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all group shadow-sm">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="text-xs font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-800">
                                                                            {new Date(h.start * 1000).toISOString().substr(14, 5)} - {new Date(h.end * 1000).toISOString().substr(14, 5)}
                                                                        </span>
                                                                        <a href={`${selectedSummary.input_content}&t=${Math.floor(h.start)}s`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium">Watch ↗</a>
                                                                    </div>
                                                                    <p className="text-slate-700 dark:text-slate-300 text-sm italic border-l-2 border-slate-200 dark:border-slate-700 pl-3">"{h.text || h.quote}"</p>
                                                                </div>
                                                            ));
                                                        } catch {
                                                            return <div className="text-red-500 bg-red-50 p-3 rounded-lg text-sm">Error parsing highlights data.</div>;
                                                        }
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className="w-full">
                                                    {/* Video Context Header - Standardized Design */}
                                                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 dark:border-slate-800/60 shadow-xl mb-8 group hover:border-red-500/30 transition-all duration-500">
                                                        {/* Large Thumbnail */}
                                                        {selectedSummary.input_type === 'video' && getYouTubeID(selectedSummary.input_content) && (
                                                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-slate-200 dark:bg-slate-700 shadow-inner group-hover:shadow-2xl transition-all duration-500 cursor-pointer" onClick={() => window.open(selectedSummary.input_content, '_blank')}>
                                                                <img
                                                                    src={getThumbnailUrl(selectedSummary.input_content)}
                                                                    alt="Video Thumbnail"
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                                                                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Video Details */}
                                                        <div className="text-center">
                                                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 tracking-tight">
                                                                {selectedSummary.original_filename || "YouTube Video"}
                                                            </h4>
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 max-w-full">
                                                                <span className="text-[10px] uppercase font-black text-slate-400">Source URL</span>
                                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[300px]">
                                                                    {selectedSummary.input_content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/60 dark:border-slate-800/60 leading-relaxed text-slate-700 dark:text-slate-300 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5 max-h-[600px] overflow-y-auto custom-scrollbar custom-markdown">
                                                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                                            <h4 className="text-indigo-600 dark:text-indigo-400 font-black flex items-center gap-2 text-xs uppercase tracking-widest">
                                                                <span>📝</span> AI Summary
                                                            </h4>
                                                        </div>
                                                        <ReactMarkdown
                                                            components={{
                                                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-3" {...props} />,
                                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-3 mb-2" {...props} />,
                                                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1" {...props} />,
                                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3 space-y-1" {...props} />,
                                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...props} />,
                                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                                strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                                            }}
                                                        >
                                                            {selectedSummary.summary_output}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Modal Footer */}
                            <motion.div layout className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-2xl flex justify-between items-center flex-shrink-0">
                                <div className="text-xs text-slate-500 font-mono">
                                    {!isComparisonMode && new Date(selectedSummary.created_at).toLocaleString()}
                                </div>
                                <div className="flex gap-2">
                                    {isComparisonMode && (
                                        <button
                                            onClick={handleCopyInput}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isCopied
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                }`}
                                        >
                                            {isCopied ? "✓ Original Copied" : "📋 Copy Original"}
                                        </button>
                                    )}
                                    {selectedSummary.input_type === 'text' && (
                                        <button
                                            onClick={() => setIsComparisonMode(!isComparisonMode)}
                                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {isComparisonMode ? "View Summary Only" : "Open Text"}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCopySummary}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isSummaryCopied
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        {isSummaryCopied ? "✓ Summary Copied" : "✨ Copy Summary"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedSummary(null);
                                            setIsComparisonMode(false);
                                        }}
                                        className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                )
            }
            {/* Confirmation Modal */}
            {
                (itemToDelete || isClearingAll || showConfirmDeleteModal) && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => {
                            setItemToDelete(null);
                            setIsClearingAll(false);
                            setShowConfirmDeleteModal(false);
                        }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />

                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-red-600 dark:text-red-400">
                                    🗑️
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    {isClearingAll ? "Clear All History?" : showConfirmDeleteModal ? `Delete ${selectedItems.size} ${filter === 'all' ? 'Items' : filter === 'highlights' ? 'Highlights' : filter + 's'}?` : "Delete Summary?"}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    {isClearingAll
                                        ? "This action cannot be undone. All your saved summaries and files will be permanently removed."
                                        : showConfirmDeleteModal
                                            ? `Are you sure you want to delete these ${selectedItems.size} items from your ${filter} history? This cannot be undone.`
                                            : "Are you sure you want to remove this summary? The original file will also be deleted."}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setItemToDelete(null);
                                        setIsClearingAll(false);
                                        setShowConfirmDeleteModal(false);
                                    }}
                                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={showConfirmDeleteModal ? confirmBatchDelete : executeDelete}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-500/20 dark:shadow-red-900/40"
                                >
                                    {isClearingAll ? "Yes, Clear All" : "Yes, Delete"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Statistics Modal */}
            {
                statsSelection && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setStatsSelection(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    📊 Statistics
                                </h3>
                                <button
                                    onClick={() => setStatsSelection(null)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Word Count */}
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Word Count</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-xl font-bold text-emerald-600">{statsSelection.orig_words}</span>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-xl font-bold text-emerald-600">{statsSelection.summ_words}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">From → To</p>
                                    </div>
                                </div>

                                {/* Sentence Count */}
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sentence Count</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-xl font-bold text-emerald-600">{statsSelection.orig_sentences}</span>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-xl font-bold text-emerald-600">{statsSelection.summ_sentences}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">From → To</p>
                                    </div>
                                </div>

                                {/* Character Count */}
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Characters</p>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-xl font-bold text-emerald-600">{statsSelection.orig_chars}</span>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-xl font-bold text-emerald-600">{statsSelection.summ_chars}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">From → To</p>
                                    </div>
                                </div>

                                {/* Reduction % */}
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Reduction</span>
                                    <span className="text-2xl font-bold text-emerald-600">
                                        {statsSelection.orig_words > 0
                                            ? Math.round((1 - (statsSelection.summ_words / statsSelection.orig_words)) * 100)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Comparison Modal */}
            {
                showComparisonModal && selectedComparisonSet && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
                        onClick={() => setShowComparisonModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-[95vw] h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        ⚖️ Summary Comparison
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-xl">
                                        {selectedComparisonSet.baseItem.input_content}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowComparisonModal(false)}
                                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-300"
                                >
                                    Close Comparison
                                </button>
                            </div>

                            {/* Content Grid */}
                            <div className="flex-1 grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 overflow-hidden">
                                {['short', 'medium', 'long'].map((type) => {
                                    const item = selectedComparisonSet.items.find(i => i.preference === type);
                                    const isCopied = comparisonCopiedState[type];
                                    return (
                                        <div key={type} className="flex flex-col h-full bg-slate-50/30 dark:bg-slate-900/30">
                                            {/* Column Header */}
                                            <div className={`p-3 text-center border-b border-slate-100 dark:border-slate-800 ${type === 'short' ? 'bg-emerald-50 dark:bg-emerald-900/10' :
                                                type === 'medium' ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-rose-50 dark:bg-rose-900/10'
                                                }`}>
                                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${type === 'short' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                                    type === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                                    }`}>
                                                    {type} Summary
                                                </span>
                                            </div>

                                            {/* Statistics */}
                                            <div className="p-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <div>Words: <span className="text-slate-900 dark:text-white font-bold">{item?.summ_words}</span></div>
                                                <div>Reduction: <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {item?.orig_words ? Math.round((1 - (item.summ_words / item.orig_words)) * 100) : 0}%
                                                </span></div>
                                            </div>

                                            {/* Text Content */}
                                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-slate-950">
                                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                                                    {item?.summary_output}
                                                </div>
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                                <button
                                                    onClick={() => handleCopyComparison(item?.summary_output, type)}
                                                    className={`w-full py-2 rounded text-xs font-bold transition-colors ${isCopied
                                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                >
                                                    {isCopied ? "✓ Copied" : "Copy Text"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )
            }

        </div >
    );
}
