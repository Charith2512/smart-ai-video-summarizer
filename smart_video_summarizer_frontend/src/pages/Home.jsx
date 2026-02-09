import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import InputSection from '../components/InputSection';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import FeaturesSection from '../components/landing/FeaturesSection';
import UseCasesSection from '../components/landing/UseCasesSection';
import FAQSection from '../components/landing/FAQSection';
import Footer from '../components/landing/Footer';
import HighlightsPlayer from '../components/HighlightsPlayer';
import AuthBenefitsSection from '../components/landing/AuthBenefitsSection';
import ErrorBoundary from '../components/ErrorBoundary';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import WhyChooseUsSection from '../components/landing/WhyChooseUsSection';
import SignOutConfirmModal from '../components/SignOutConfirmModal';
import SuccessModal from '../components/SuccessModal';
import SummarizingLoader from '../components/SummarizingLoader';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollToTop from '../components/ScrollToTop';
import { getYouTubeID, getThumbnailUrl } from '../utils/youtube';





export default function Home() {
    const [inputType, setInputType] = useState('text');
    const [summaryLength, setSummaryLength] = useState('medium');
    const [formatMode, setFormatMode] = useState('paragraph');
    const [highlights, setHighlights] = useState(true);
    const [url, setUrl] = useState(''); // Lifted state for persistence (used for Video URL AND Text Content)
    const [file, setFile] = useState(null); // Lifted state for PDF file
    const [fileName, setFileName] = useState(''); // For PDF Filename restoration
    const [currentPage, setCurrentPage] = useState(1); // Pagination state
    const [showPlayer, setShowPlayer] = useState(false); // Toggle for Reel Player
    // Lifted Player State
    const [activeClipIndex, setActiveClipIndex] = useState(0);
    const [availableQualities, setAvailableQualities] = useState(['720p']);
    const [videoTitle, setVideoTitle] = useState(''); // New state for video title



    // Core Data State
    const [summary, setSummary] = useState('');
    const [highlightsOutput, setHighlightsOutput] = useState(null);
    const [loading, setLoading] = useState(false);
    const [summarizeProgress, setSummarizeProgress] = useState(-1);

    // Stats State
    const [inputStats, setInputStats] = useState({ words: 0, sentences: 0, chars: 0 });
    const [outputStats, setOutputStats] = useState(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    // Duplicate Detection State
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateData, setDuplicateData] = useState(null);
    const [lastData, setLastData] = useState(null);

    // Auth & Feedback State
    const [showAuthModal, setShowAuthModal] = useState(false); // Restriction Popup
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // Actual Login Form
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [restrictedFeature, setRestrictedFeature] = useState(null);

    const calcStats = (txt) => {
        if (!txt) return { words: 0, sentences: 0, chars: 0 };
        const words = txt.trim().split(/\s+/).length;
        const sentences = txt.split(/[.!?]+/).length - 1 || 1;
        const chars = txt.length;
        return { words, sentences, chars };
    };

    const { currentUser, logout } = useAuth(); // Get logged in user
    const navigate = useNavigate();
    const location = useLocation();

    const handleAuthSuccess = (msg) => {
        setSuccessMessage(msg);
        setIsSuccessModalOpen(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await logout();
            setSuccessMessage('Logged out successfully');
            setIsSuccessModalOpen(true);
            navigate('/');
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    // Check for incoming state from History or Sidebar
    useEffect(() => {
        if (location.state) {
            if (location.state.reset) {
                setSummary('');
                setHighlightsOutput(null);
                setSummary('');
                setHighlightsOutput(null);
                setUrl('');
                setFileName('');
                setInputStats({ words: 0, sentences: 0, chars: 0 });
                setOutputStats(null);
                setShowPlayer(false);
            } else if (location.state.url || location.state.summary) {
                console.log("Loading state from Sidebar/History:", location.state);
                if (location.state.url) setUrl(location.state.url);
                if (location.state.summary) setSummary(location.state.summary);
                if (location.state.highlights) setHighlightsOutput(location.state.highlights);
                if (location.state.inputType) setInputType(location.state.inputType);
                if (location.state.fileName) setFileName(location.state.fileName);
                if (location.state.inputStats) setInputStats(location.state.inputStats);
                if (location.state.outputStats) setOutputStats(location.state.outputStats);
                if (location.state.availableQualities) setAvailableQualities(location.state.availableQualities);
                if (location.state.videoTitle) setVideoTitle(location.state.videoTitle); // Restoring title from History/Sidebar

                if (location.state.inputType === 'highlights') {
                    setShowPlayer(true);
                    setActiveClipIndex(0);
                } else {
                    setShowPlayer(false);
                    // If we have summary, calculate stats for it
                    if (location.state.summary) {
                        setOutputStats(calcStats(location.state.summary));
                    }
                }
            }

            // Clear state to prevent reload loops
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const ITEMS_PER_PAGE = 5;

    // Sync Pagination with Active Clip
    useEffect(() => {
        if (highlightsOutput && highlightsOutput.length > 0) {
            const targetPage = Math.ceil((activeClipIndex + 1) / ITEMS_PER_PAGE);
            if (targetPage !== currentPage) {
                setCurrentPage(targetPage);
            }
        }
    }, [activeClipIndex, highlightsOutput]); // Removed currentPage to allow manual browsing

    // Handle Tab Switching (Clears output AND input as requested)
    const handleTypeChange = (type) => {
        setInputType(type);
        setSummary('');
        setHighlightsOutput(null);
        setOutputStats(null);
        setDuplicateData(null);
        setShowDuplicateModal(false);

        // Clear Inputs
        setUrl('');
        setFile(null);
        setFileName('');
        setInputStats({ words: 0, sentences: 0, chars: 0 });
    };

    const [requestId, setRequestId] = useState(null);
    const abortControllerRef = useRef(null);

    const handleStop = async () => {
        // 1. Abort Frontend Fetch
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 2. Signal Backend to Cancel Task
        if (requestId) {
            try {
                await fetch(`http://localhost:8000/cancel_processing/${requestId}`, {
                    method: 'POST'
                });
            } catch (e) {
                console.warn("Failed to notify backend of cancellation:", e);
            }
        }

        // 3. Reset UI
        setLoading(false);
        setSummarizeProgress(-1);
        alert("Generation Stopped.");
    };

    const handleSummarize = async (data, forceOverride = false) => {
        // 1. Check Auth Layer (Relaxed for Text/PDF)
        if (!currentUser && (inputType === 'video' || inputType === 'highlights')) {
            setRestrictedFeature(inputType);
            setShowAuthModal(true);
            return;
        }

        const userId = currentUser ? currentUser.uid : null;

        // Cache the latest input data for "Generate New" retries
        setLastData(data);

        // Generate ID and Abort Controller
        const newRequestId = window.crypto.randomUUID();
        setRequestId(newRequestId);
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setLoading(true);
        setSummarizeProgress(0);
        setSummary('');

        try {
            if (inputType === 'text') {
                if (!data.text) { alert("Please enter some text!"); setLoading(false); return; }

                // Stage 1: Extraction (for text it's instant, but let's simulate a phase)
                setSummarizeProgress(20);

                const response = await fetch('http://localhost:8000/summarize/text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal,
                    body: JSON.stringify({
                        text: data.text,
                        length: summaryLength,
                        format_mode: formatMode,
                        user_id: userId,
                        force_new: forceOverride
                    }),
                });

                if (!response.ok) throw new Error("Backend failed");
                setSummarizeProgress(60); // AI Processing stage
                const result = await response.json();
                setSummarizeProgress(90); // Finalizing stage

                if (result.status === "duplicate") {
                    setLoading(false);
                    setDuplicateData(result.summary);
                    setShowDuplicateModal(true);
                    return;
                }

                setSummary(result.summary.summary_text || result.summary);

                if (result.summary.stats && result.summary.stats.summary) {
                    setOutputStats({
                        words: result.summary.stats.summary.words,
                        sentences: result.summary.stats.summary.sentences,
                        chars: result.summary.stats.summary.chars
                    });
                    if (result.summary.stats.original) {
                        setInputStats(result.summary.stats.original);
                    }
                } else if (result.summary.summary_text) {
                    setOutputStats(calcStats(result.summary.summary_text));
                }

            } else if (inputType === 'pdf') {
                if (!data.file) { alert("Please upload a PDF file!"); setLoading(false); return; }

                setSummarizeProgress(15); // Upload starting
                const formData = new FormData();
                formData.append('file', data.file);
                formData.append('length', summaryLength);
                formData.append('format_mode', formatMode);
                if (userId) formData.append('user_id', userId);
                if (forceOverride) formData.append('force_new', 'true');

                const response = await fetch('http://localhost:8000/summarize/upload_pdf', {
                    method: 'POST',
                    signal,
                    body: formData,
                });

                if (!response.ok) throw new Error("Backend failed");
                setSummarizeProgress(50); // Reading PDF stage
                const result = await response.json();
                setSummarizeProgress(85); // Analyzing details stage

                if (result.status === "duplicate") {
                    setLoading(false);
                    setDuplicateData(result.summary);
                    setShowDuplicateModal(true);
                    return;
                }

                setSummary(result.summary.summary_text || result.summary);

                if (result.summary.stats && result.summary.stats.summary) {
                    setOutputStats({
                        words: result.summary.stats.summary.words,
                        sentences: result.summary.stats.summary.sentences,
                        chars: result.summary.stats.summary.chars
                    });
                    if (result.summary.stats.original) {
                        setInputStats(result.summary.stats.original);
                    }
                }

            } else if (inputType === 'video' || inputType === 'highlights') {
                if (!data.url) { alert("Please enter a video URL!"); setLoading(false); return; }

                setSummarizeProgress(10); // Connecting to YT
                const taskType = inputType === 'highlights' ? 'highlights' : 'summary';

                const response = await fetch('http://localhost:8000/summarize/youtube', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal,
                    body: JSON.stringify({
                        url: data.url,
                        length: "detailed",
                        format_mode: formatMode,
                        user_id: userId,
                        force_new: forceOverride,
                        task: taskType,
                        request_id: newRequestId
                    }),
                });

                if (!response.ok) throw new Error("Backend failed");
                setSummarizeProgress(40); // Transcript Extraction stage
                const result = await response.json();
                setSummarizeProgress(80); // Processing AI Narrative stage

                if (result.status === "duplicate") {
                    setLoading(false);
                    setDuplicateData(result.summary);
                    setShowDuplicateModal(true);
                    return;
                }

                if (taskType === 'highlights') {
                    // Correctly extract the highlights array from the summary object
                    setHighlightsOutput(result.summary.highlights || []);
                    // Use rich quality objects if available, otherwise simple strings
                    setAvailableQualities(result.summary.quality_options || result.summary.available_qualities || ['720p']);
                    setVideoTitle(result.summary.original_filename || "");
                    setSummary('');
                } else {
                    setSummary(result.summary.summary_text || result.summary);
                    setVideoTitle(result.summary.original_filename || "");
                    setHighlightsOutput(null);
                }

                if (result.summary.stats && result.summary.stats.summary) {
                    setOutputStats(result.summary.stats.summary);
                    if (result.summary.stats.original) {
                        setInputStats(result.summary.stats.original);
                    }
                }
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Fetch aborted by user");
                return;
            }
            console.error("Summarization error:", error);
            alert("Failed to summarize. Is the backend running?");
        } finally {
            setSummarizeProgress(100);
            setTimeout(() => {
                setLoading(false);
                setSummarizeProgress(-1);
            }, 500);
        }
    };

    const handleExport = async (format) => {
        try {
            const endpoint = format === 'pdf' ? 'pdf' : 'docx';
            const response = await fetch(`http://localhost:8000/export/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: summary })
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `summary.${format === 'pdf' ? 'pdf' : 'docx'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setShowExportMenu(false);
        } catch (error) {
            console.error("Export error:", error);
            alert("Failed to export summary.");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleViewPrevious = () => {
        if (!duplicateData) return;
        setSummary(duplicateData.summary_text);

        // Restore highlights if present
        if (duplicateData.highlights) {
            setHighlightsOutput(duplicateData);
        } else {
            setHighlightsOutput(null);
        }

        if (duplicateData.stats && duplicateData.stats.summary) {
            setOutputStats(duplicateData.stats.summary);
            if (duplicateData.stats.original) {
                setInputStats(duplicateData.stats.original);
            }
        }
        setShowDuplicateModal(false);
    };

    const handleForceGenerate = () => {
        setShowDuplicateModal(false);
        if (lastData) {
            handleSummarize(lastData, true);
        }
    };


    return (
        <div className="min-h-screen text-slate-900 dark:text-slate-100 selection:bg-slate-900/20 dark:selection:bg-slate-100/20 selection:text-slate-900 dark:selection:text-white relative font-sans transition-colors duration-300">
            <Navbar
                onOpenAuth={() => setIsLoginModalOpen(true)}
                onOpenSignOut={() => setIsSignOutModalOpen(true)}
            />
            <ScrollToTop />

            {/* Background decoration - Light Mode (Hidden in Dark Mode) */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40 dark:opacity-0 transition-opacity duration-300">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-200/40 rounded-full blur-[100px] animate-float" style={{ animationDelay: '0s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gray-200/40 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }} />
            </div>

            {/* Background decoration - Dark Mode (Subtle Slate Glows) */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-0 dark:opacity-20 transition-opacity duration-300">
                <div className="absolute top-[20%] right-[20%] w-[600px] h-[600px] bg-slate-800/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-slate-800/20 rounded-full blur-[120px]" />
            </div>



            <div className={`${highlightsOutput && highlightsOutput.length > 0 && inputType === 'highlights' ? 'max-w-[1850px]' : 'max-w-[1700px]'} mx-auto px-4 py-8 w-full transition-all duration-300`}>
                {/* Benefits of Sign In (Only for guests) - Placed at Top */}
                {!currentUser && <AuthBenefitsSection onOpenAuth={() => setIsLoginModalOpen(true)} />}

                <header className="mb-16 text-center relative z-10">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight animate-fade-in-down drop-shadow-sm" style={{ animationDuration: '0.8s' }}>
                        Smart AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-400 dark:to-white">Summarizer</span>
                    </h1>
                    <p key={inputType} className="text-slate-500 text-xl font-medium animate-fade-in max-w-4xl mx-auto leading-relaxed">
                        {inputType === 'text' && "Transform long articles, notes, or essays into concise insights instantly."}
                        {inputType === 'pdf' && "Upload research papers or documents to extract key summaries quickly."}
                        {inputType === 'video' && "Convert YouTube videos into clear, readable text summaries in seconds."}
                        {inputType === 'highlights' && "Automatically extract viral-worthy clips and key moments from any video."}
                    </p>
                </header>

                <main className={`mx-auto flex flex-col w-full ${highlightsOutput && highlightsOutput.length > 0 && inputType === 'highlights' ? 'lg:flex-row items-start' : 'md:flex-row items-start'} gap-8 relative z-10 transition-all duration-300`}>
                    {/* LEFT COLUMN: INPUT / PLAYER (Conditional Class) */}
                    <div className={`${highlightsOutput && highlightsOutput.length > 0 && inputType === 'highlights' ? 'w-full lg:w-[58%]' : 'w-full md:w-1/2'} p-8 md:p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/20 dark:shadow-slate-950/40 relative transition-all duration-300`}>
                        <div className="relative z-10">
                            {/* Tab Switcher - Now always visible */}
                            <div className="flex flex-wrap justify-center gap-2 mb-10 p-2 bg-slate-100 dark:bg-slate-800 rounded-full w-fit mx-auto border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                                {['video', 'pdf', 'text', 'highlights'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            if (!currentUser && (type === 'video' || type === 'highlights')) {
                                                setRestrictedFeature(type);
                                                setShowAuthModal(true);
                                                return;
                                            }
                                            handleTypeChange(type);
                                        }}
                                        className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 capitalize z-10 ${inputType === type ? 'text-slate-900' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {inputType === type && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-white rounded-full shadow-sm ring-1 ring-black/5"
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {type}
                                            {!currentUser && (type === 'video' || type === 'highlights') && (
                                                <span className="text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-500">🔒</span>
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Highlights Player - MOVED TO TOP OF WORKSPACE IF IN HIGHLIGHTS MODE */}
                            {inputType === 'highlights' && highlightsOutput && highlightsOutput.length > 0 && (
                                <div className="mb-0">
                                    <ErrorBoundary>
                                        <HighlightsPlayer
                                            url={url}
                                            highlights={highlightsOutput}
                                            currentIndex={activeClipIndex}
                                            onClipChange={setActiveClipIndex}
                                            availableQualities={availableQualities}
                                        />
                                    </ErrorBoundary>
                                </div>
                            )}

                            {/* POST-SUMMARY VIDEO CARD (Left Column - Context) */}
                            {(inputType === 'video' || inputType === 'highlights') && (summary || highlightsOutput) && url && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mb-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 dark:border-slate-800/50 shadow-xl group hover:border-red-500/50 transition-all duration-500 ring-1 ring-slate-900/5 dark:ring-white/5"
                                >
                                    {/* 1. Large Thumbnail - Styled to match Highlights Player exactly */}
                                    <div className="relative w-full aspect-video rounded-[1.5rem] overflow-hidden bg-black border-[4px] border-white dark:border-slate-800 shadow-2xl mb-4 ring-1 ring-black/10 dark:ring-white/10 group">
                                        <img
                                            src={getThumbnailUrl(url)}
                                            alt="Video Thumbnail"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                                            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Text Details */}
                                    <div className="mb-4">
                                        <h4 className="font-black text-lg text-slate-900 dark:text-white mb-2 leading-tight">
                                            {videoTitle || "Untitled Video"}
                                        </h4>
                                        <div className="flex items-center gap-2 group/url">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Source</span>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono bg-slate-50/50 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 flex-1">
                                                {url}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3. Watch Button (Full Width) */}
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
                                    >
                                        <span>Watch on YouTube</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                        </svg>
                                    </a>
                                </motion.div>
                            )}

                            {(inputType === 'text' || inputStats.words > 0) && (
                                <div className="mb-4 flex justify-end animate-fade-in">
                                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-lg px-4 py-2 flex gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        <span>Input Words: <strong className="text-slate-900 dark:text-slate-200">{inputStats.words || 0}</strong></span>
                                        <span className="w-[1px] bg-slate-200 dark:bg-slate-700"></span>
                                        <span>Sentences: <strong className="text-slate-900 dark:text-slate-200">{inputStats.sentences || 0}</strong></span>
                                    </div>
                                </div>
                            )}

                            <InputSection
                                inputType={inputType}
                                summaryLength={summaryLength}
                                setSummaryLength={setSummaryLength}
                                formatMode={formatMode}
                                setFormatMode={setFormatMode}
                                highlights={highlights}
                                setHighlights={setHighlights}
                                isLoading={loading}
                                onStop={handleStop}
                                onSummarize={handleSummarize}
                                onTextChange={(val) => setInputStats(calcStats(val))}
                                url={url}
                                setUrl={setUrl}
                                file={file}
                                setFile={setFile}
                                fileName={fileName}
                            />

                        </div>
                    </div>

                    {/* RIGHT COLUMN: OUTPUT / TRANSCRIPT (Conditional Class) */}
                    <div className={`${highlightsOutput && highlightsOutput.length > 0 && inputType === 'highlights' ? 'w-full lg:w-[42%]' : 'w-full md:w-1/2'} p-8 md:p-10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/20 dark:shadow-slate-950/40 relative transition-all duration-300`}>
                        <div className="p-0 flex flex-col">
                            <div className="flex flex-col gap-4 mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center text-lg shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10">✨</span>
                                    Summary Result
                                </h2>

                                {/* Compact Stats Pill - Moved to second line */}
                                {(summary || highlightsOutput) && outputStats && inputType !== 'highlights' && (
                                    <div className="flex items-center self-start gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-full px-4 py-2 animate-fade-in shadow-sm relative z-20">
                                        {(inputType === 'text' || inputType === 'pdf') && (
                                            <>
                                                <div className="flex items-center gap-4 text-[12px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="opacity-60">Words</span>
                                                        <span className="text-sm">{outputStats.words}</span>
                                                    </div>
                                                    <div className="w-px h-3 bg-emerald-200 dark:bg-emerald-800"></div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="opacity-60">Sentences</span>
                                                        <span className="text-sm">{outputStats.sentences}</span>
                                                    </div>
                                                </div>
                                                <div className="w-px h-4 bg-emerald-200 dark:bg-emerald-800 mx-1"></div>
                                            </>
                                        )}

                                        <div className="flex items-center gap-1.5">
                                            {inputType !== 'highlights' && (
                                                <button
                                                    onClick={handleCopy}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-emerald-600"
                                                    title="Copy Summary"
                                                >
                                                    {copied ? <span className="text-xs font-bold px-1 bg-white rounded shadow-sm">✓ COPIED</span> : <span className="text-lg">📋</span>}
                                                </button>
                                            )}
                                            {(inputType === 'text' || inputType === 'pdf') && (
                                                <button
                                                    onClick={() => setShowStatsModal(true)}
                                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                                    title="View Detailed Stats"
                                                >
                                                    <span className="text-lg">📊</span>
                                                </button>
                                            )}
                                            {inputType !== 'highlights' && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                                        className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                                        title="Export"
                                                    >
                                                        <span className="text-lg">📤</span>
                                                    </button>
                                                    {showExportMenu && (
                                                        <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[100] animate-fade-in-up text-slate-700 dark:text-slate-200 ring-1 ring-black/5">
                                                            <button
                                                                onClick={() => handleExport('pdf')}
                                                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-black tracking-tight transition-colors flex items-center gap-2 border-b border-slate-50 dark:border-slate-800 shadow-sm"
                                                            >
                                                                📄 EXPORT AS PDF
                                                            </button>
                                                            <button
                                                                onClick={() => handleExport('word')}
                                                                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-black tracking-tight transition-colors flex items-center gap-2"
                                                            >
                                                                📝 EXPORT AS WORD
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence mode="wait">
                                {(loading || summary || highlightsOutput) ? (
                                    <motion.div
                                        key={loading ? "loading" : "result"}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.4 }}
                                        className="h-full"
                                    >
                                        {loading ? (
                                            <SummarizingLoader />
                                        ) : (
                                            <>
                                                {/* 0. QUOTA ERROR ALERT ... */}
                                                {highlightsOutput && Array.isArray(highlightsOutput) && highlightsOutput.length === 1 && highlightsOutput[0].error === "QUOTA_EXCEEDED" && (
                                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-pulse">
                                                        <div className="flex items-center gap-3 text-red-600 font-bold mb-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            <h3>AI Quota Limit Reached</h3>
                                                        </div>
                                                        <p className="text-sm text-red-700 ml-9">
                                                            {highlightsOutput[0].details}
                                                        </p>
                                                        <div className="ml-9 mt-2 text-xs text-red-500">
                                                            Suggestion: Wait 60 seconds or switch to a faster model (Gemini Flash).
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 0.5 FALLBACK WARNING ALERT */}
                                                {highlightsOutput && Array.isArray(highlightsOutput) && highlightsOutput.length > 0 && highlightsOutput[0].warning === "MODEL_SWITCHED" && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 animate-fade-in">
                                                        <div className="flex items-center gap-3 text-amber-600 font-bold mb-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            <h3>Model Switched</h3>
                                                        </div>
                                                        <p className="text-sm text-amber-700 ml-9">
                                                            {highlightsOutput[0].details}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* 0.6 VISUAL FALLBACK WARNING (No Transcript) */}
                                                {highlightsOutput && Array.isArray(highlightsOutput) && highlightsOutput.length > 0 && highlightsOutput[0].warning === "NO_TRANSCRIPT" && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 animate-fade-in">
                                                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500 font-bold mb-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <h3>Visual Analysis Available (No Text)</h3>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 ml-9">
                                                            {highlightsOutput[0].details}
                                                        </p>
                                                        <div className="ml-9 mt-3">
                                                            <button
                                                                onClick={() => handleTypeChange('video')}
                                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                                                            >
                                                                Switch to Summary Mode
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 1. KEY QUOTES TRANSCRIPT (Side-by-Side Right Column) */}
                                                {highlightsOutput && Array.isArray(highlightsOutput) && highlightsOutput.length > 0 && !highlightsOutput[0].error && !highlightsOutput[0].warning && (
                                                    <div className="animate-fade-in flex flex-col">
                                                        <div className="flex items-center justify-between mb-6 shrink-0">
                                                            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                                🗝️ Key Moments
                                                            </h3>
                                                            {/* Timer Pill */}
                                                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                                                <span className="opacity-60">Total Reel:</span>
                                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                                    {(() => {
                                                                        const totalSecs = highlightsOutput.reduce((acc, curr) => acc + ((curr.end || 0) - (curr.start || 0)), 0);
                                                                        const date = new Date(totalSecs * 1000);
                                                                        const mm = date.getUTCMinutes();
                                                                        const ss = date.getUTCSeconds();
                                                                        return `${mm}:${ss.toString().padStart(2, '0')}`;
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Scrollable Container - collapsing to content but allowing scroll if needed */}
                                                        <div className="space-y-3">
                                                            {(() => {
                                                                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                                                                const paginatedItems = highlightsOutput.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                                                                return (
                                                                    <>
                                                                        {paginatedItems.map((item, localIndex) => {
                                                                            const globalIndex = startIndex + localIndex;
                                                                            const isActive = activeClipIndex === globalIndex;
                                                                            return (
                                                                                <div
                                                                                    key={globalIndex}
                                                                                    onClick={() => setActiveClipIndex(globalIndex)}
                                                                                    className={`
                                                                                        p-4 rounded-[1.25rem] border transition-all cursor-pointer group relative overflow-hidden backdrop-blur-xl
                                                                                        ${isActive
                                                                                            ? 'bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-500/40 ring-4 ring-emerald-500/10 shadow-xl shadow-emerald-500/10 scale-[1.01]'
                                                                                            : 'bg-white/40 dark:bg-slate-900/40 border-white/60 dark:border-slate-800/60 hover:border-emerald-400/50 dark:hover:border-emerald-500/50 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:shadow-lg hover:-translate-y-0.5'
                                                                                        }
                                                                                    `}
                                                                                >
                                                                                    {isActive && (
                                                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                                                                    )}
                                                                                    <div className="flex flex-col gap-2 pl-2">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center gap-2">
                                                                                                {isActive && <span className="animate-pulse text-emerald-600 font-bold ml-[-4px]">▸</span>}
                                                                                                <span className={`${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400 dark:text-slate-500'} font-mono text-xs font-bold transition-colors`}>
                                                                                                    #{globalIndex + 1}
                                                                                                </span>
                                                                                            </div>
                                                                                            {item.start !== undefined && (
                                                                                                <span className={`text-[10px] px-2 py-1 rounded-lg font-bold font-mono transition-colors ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                                                                    {new Date(item.start * 1000).toISOString().substr(14, 5)} - {new Date(item.end * 1000).toISOString().substr(14, 5)}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className={`text-sm transition-colors leading-relaxed ${isActive ? 'text-slate-900 dark:text-slate-100 font-bold' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>
                                                                                            {item.text || item.quote}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}

                                                                        {/* Pagination Controls - Moved inside/right below items */}
                                                                        {highlightsOutput.length > ITEMS_PER_PAGE && (
                                                                            <div className="flex items-center justify-between px-2 pt-6 shrink-0">
                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                                                                                        disabled={currentPage === 1}
                                                                                        className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white dark:border-slate-700 text-slate-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(Math.ceil(highlightsOutput.length / ITEMS_PER_PAGE), prev + 1)); }}
                                                                                        disabled={currentPage === Math.ceil(highlightsOutput.length / ITEMS_PER_PAGE)}
                                                                                        className="p-2.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white dark:border-slate-700 text-slate-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                                                                    Page <span className="text-emerald-600 dark:text-emerald-400">{currentPage}</span> / {Math.ceil(highlightsOutput.length / ITEMS_PER_PAGE)}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                                {summary && (
                                                    summary === "The video is too long. Please try a shorter length video." ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-8 text-center shadow-xl shadow-red-500/5"
                                                        >
                                                            <div className="flex flex-col items-center justify-center gap-4">
                                                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                                                                    <span className="text-3xl">⚠️</span>
                                                                </div>
                                                                <h3 className="text-xl font-black text-red-600 dark:text-red-400">
                                                                    Video Too Long
                                                                </h3>
                                                                <p className="text-red-700 dark:text-red-300 font-medium text-lg max-w-md mx-auto">
                                                                    {summary}
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/60 dark:border-slate-800/60 leading-relaxed text-slate-700 dark:text-slate-300 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/5 max-h-[700px] overflow-y-auto custom-scrollbar text-base custom-markdown"
                                                        >
                                                            <ReactMarkdown
                                                                components={{
                                                                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-6 mb-4" {...props} />,
                                                                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-5 mb-3" {...props} />,
                                                                    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2" {...props} />,
                                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
                                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                                                    strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                                                                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-slate-600 dark:text-slate-400 my-4" {...props} />,
                                                                }}
                                                            >
                                                                {summary}
                                                            </ReactMarkdown>
                                                        </motion.div>
                                                    )
                                                )}

                                            </>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center text-slate-400 dark:text-slate-500 py-20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm h-full flex flex-col items-center justify-center transition-all"
                                    >
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl opacity-50">⚡</div>
                                        <p className="font-medium">Ready to generate insights</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>


                    {
                        showStatsModal && outputStats && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setShowStatsModal(false)}>
                                <div
                                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up ring-1 ring-slate-900/5 dark:ring-white/5"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            📊 Detailed Statistics
                                        </h3>
                                        <button
                                            onClick={() => setShowStatsModal(false)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Word Count</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs font-medium text-slate-400">Input:</span>
                                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{inputStats.words}</span>
                                                    <span className="text-slate-300 mx-1">→</span>
                                                    <span className="text-xs font-medium text-slate-400">Output:</span>
                                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{outputStats.words}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Sentence Count</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs font-medium text-slate-400">Input:</span>
                                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{inputStats.sentences}</span>
                                                    <span className="text-slate-300 mx-1">→</span>
                                                    <span className="text-xs font-medium text-slate-400">Output:</span>
                                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{outputStats.sentences}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">Reduction</span>
                                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                {inputStats.words > 0
                                                    ? Math.round((1 - (outputStats.words / inputStats.words)) * 100)
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </main >


                {/* Content Sections */}
                <HowItWorksSection />
                <FeaturesSection />
                <WhyChooseUsSection />
                <UseCasesSection />
                <FAQSection />
                <Footer />

                {/* Modals placed globally */}
                {
                    showDuplicateModal && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in">
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-yellow-200/50 dark:border-yellow-900/50 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-scale-in relative ring-1 ring-slate-900/5 dark:ring-white/5">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                                <div className="p-6 text-center">
                                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-100">
                                        <span className="text-3xl">⚠️</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Already Summarized!</h3>
                                    <p className="text-slate-500 mb-6">
                                        You have summarized this content before.
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={handleViewPrevious}
                                            className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-all"
                                        >
                                            View Previous
                                        </button>
                                        <button
                                            onClick={handleForceGenerate}
                                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-orange-500/20 text-white font-bold transition-all"
                                        >
                                            Generate New
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Auth Guard Modal */}
                {
                    showAuthModal && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in"
                            onClick={() => setShowAuthModal(false)}>
                            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl animate-scale-in relative border border-white/50 dark:border-slate-800 ring-1 ring-slate-900/5 dark:ring-white/5" onClick={e => e.stopPropagation()}>
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-3xl">🔒</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Sign In Required</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                                    To use this <strong className="text-slate-900 dark:text-white capitalize">{restrictedFeature}</strong> feature, please sign in.
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setShowAuthModal(false)}
                                        className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAuthModal(false);
                                            setIsLoginModalOpen(true);
                                        }}
                                        className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-black dark:hover:bg-slate-100 hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Main Auth Modal (Login/Signup Form) */}
                <AuthModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onSuccess={handleAuthSuccess}
                />

                <SignOutConfirmModal
                    isOpen={isSignOutModalOpen}
                    onClose={() => setIsSignOutModalOpen(false)}
                    onConfirm={handleLogoutConfirm}
                />

                <SuccessModal
                    isOpen={isSuccessModalOpen}
                    onClose={() => setIsSuccessModalOpen(false)}
                    message={successMessage}
                />
            </div >
        </div >
    );
}
