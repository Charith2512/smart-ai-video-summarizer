import { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';

export default function HighlightsPlayer({ url, highlights, currentIndex = 0, onClipChange, availableQualities = ['720p'] }) {
    const playerRef = useRef(null);
    // REMOVED local currentClipIndex state - using prop instead
    const [reelMode, setReelMode] = useState(true);
    const [quality, setQuality] = useState('720p');
    const [isExporting, setIsExporting] = useState(false);
    const [videoId, setVideoId] = useState(null);

    // Ensure Default Quality is Valid
    useEffect(() => {
        if (availableQualities.length > 0 && !availableQualities.includes(quality)) {
            // If current quality invalid, pick best available (either 720p, or highest)
            if (availableQualities.includes('720p')) setQuality('720p');
            else if (availableQualities.includes('480p')) setQuality('480p');
            else setQuality(availableQualities[availableQualities.length - 1]); // Highest? Or Lowest? Sorted logic in backend was 144->2160, so last is highest.
        }
    }, [availableQualities, quality]);

    // Extract Video ID
    useEffect(() => {
        if (!url) return;
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match && match[1]) {
            setVideoId(match[1]);
        } else {
            console.error("Invalid YouTube URL:", url);
        }
    }, [url]);

    // Optimize Highlights
    const validHighlights = (highlights || [])
        .filter(h => h.start !== undefined && h.end !== undefined)
        .sort((a, b) => a.start - b.start);

    // If no highlights, don't render or handle differently
    if (!validHighlights || validHighlights.length === 0) return null;

    // Use prop for index, fallback to 0
    const safeIndex = (currentIndex >= 0 && currentIndex < validHighlights.length) ? currentIndex : 0;
    const currentClip = validHighlights[safeIndex];

    // Ref to prevent double-skipping (debounce)
    const lastSkipTime = useRef(0);

    // Force load clip when index changes
    useEffect(() => {
        if (playerRef.current && currentClip && videoId) {
            console.log(`[HighlightsPlayer] Loading Clip ${safeIndex + 1}: ${currentClip.start} -> ${currentClip.end}`);

            // This is the robust way to force YouTube to play ONLY this segment
            playerRef.current.loadVideoById({
                videoId: videoId,
                startSeconds: Math.floor(currentClip.start),
                endSeconds: Math.ceil(currentClip.end),
                suggestedQuality: 'hd720' // Use 'large', 'medium', etc if precise quality needed
            });
        }
    }, [currentClip, videoId, safeIndex]);

    const onPlayerReady = (event) => {
        console.log("YouTube Player Ready");
        playerRef.current = event.target;
        event.target.playVideo();
    };

    const onStateChange = (event) => {
        // YT.PlayerState.ENDED = 0
        if (event.data === 0) {
            console.log("State Changed: ENDED");
            handleClipEnd();
        }
    };

    const handleClipEnd = () => {
        if (!reelMode) return;

        // Debounce: Ignore if called within 1000ms of last skip
        const now = Date.now();
        if (now - lastSkipTime.current < 1000) {
            console.log("Ignoring double-skip event");
            return;
        }
        lastSkipTime.current = now;

        if (safeIndex < validHighlights.length - 1) {
            console.log("Clip ended, moving to next:", safeIndex + 1);
            if (onClipChange) {
                onClipChange(safeIndex + 1); // Notify Parent to update state
            }
        } else {
            console.log("All clips finished. Loop or stop.");
            // Stop logic
        }
    };

    // YouTube IFrame Options
    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            // We set start/end here. When props change, the player reloads/seeks automatically by library design.
            start: Math.floor(currentClip.start),
            end: Math.ceil(currentClip.end),
            modestbranding: 1,
            rel: 0,
        },
    };

    // --- EXPORT FUNCTION WIth STREAMING ---
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState("");

    const handleExport = async () => {
        setIsExporting(true);
        setDownloadProgress(0);
        setDownloadStatus("Initializing...");

        try {
            const response = await fetch('http://localhost:8000/export/video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    highlights: validHighlights,
                    quality: quality
                })
            });

            if (!response.ok) throw new Error("Export failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        if (data.status === "progress") {
                            setDownloadProgress(data.percent);
                            setDownloadStatus(data.message);
                        } else if (data.status === "completed") {
                            setDownloadProgress(100);
                            setDownloadStatus("Download ready!");

                            // Trigger File Download logic (using static file endpoint)
                            const fileUrl = `http://localhost:8000${data.url}`;
                            const a = document.createElement('a');
                            a.href = fileUrl;
                            a.download = `highlights_reel_${quality}.mp4`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        } else if (data.status === "error") {
                            throw new Error(data.message);
                        }
                    } catch (e) {
                        console.warn("Failed to parse SSE chunk:", line, e);
                    }
                }
            }
        } catch (error) {
            alert("Export Failed: " + error.message);
            setDownloadStatus("Failed");
        } finally {
            setIsExporting(false);
            setDownloadProgress(0);
            setDownloadStatus("");
        }
    };

    if (!videoId) return <div className="text-slate-500 font-medium">Loading Video...</div>;

    return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 dark:border-slate-800/50 animate-fade-in mb-12 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 relative overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
            {/* Ambient Glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                    <span className="text-3xl">🎬</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">Highlights Reel</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        Clip {safeIndex + 1} / {validHighlights.length}
                    </span>
                </h3>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm transition-all hover:shadow-md select-none">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Auto-Skip</span>
                        <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${reelMode ? 'bg-indigo-500 shadow-inner' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white dark:bg-slate-200 rounded-full shadow-sm transition-all duration-300 ${reelMode ? 'left-5' : 'left-1'}`} />
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={reelMode}
                            onChange={(e) => setReelMode(e.target.checked)}
                        />
                    </label>
                </div>
            </div>

            {/* YOUTUBE PLAYER */}
            <div className="relative aspect-video rounded-[1.5rem] overflow-hidden bg-black border-[4px] border-white dark:border-slate-800 shadow-2xl mb-8 ring-1 ring-black/10 dark:ring-white/10 group">
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    onReady={onPlayerReady}
                    onStateChange={onStateChange}
                    className="w-full h-full transform transition-transform group-hover:scale-[1.01]"
                    iframeClassName="w-full h-full"
                />
            </div>

            {/* EXPORT CONTROLS (REDESIGNED) */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-br from-indigo-50/80 to-purple-50/50 dark:from-slate-800/80 dark:to-slate-900/80 p-6 rounded-[1.5rem] border border-indigo-100 dark:border-slate-700/50 backdrop-blur-md relative z-10 transition-all shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-slate-900/50 group/export ring-1 ring-indigo-500/5 dark:ring-white/5">
                <div className="flex flex-col gap-1.5 mb-6 md:mb-0">
                    <span className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-xl ring-1 ring-slate-900/5 dark:ring-white/10 group-hover/export:scale-110 transition-transform duration-300">
                            📥
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-700 dark:from-white dark:to-slate-300">
                            Export Highlight Reel
                        </span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-[3.25rem] tracking-wide uppercase opacity-80">
                        Save your summarized insights as a video
                    </span>
                </div>

                <div className="flex items-center gap-4 ml-auto w-full md:w-auto">
                    <div className="relative group/select w-full md:w-auto">
                        <select
                            value={quality}
                            onChange={(e) => setQuality(e.target.value)}
                            className="w-full md:w-auto bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer hover:border-indigo-200 dark:hover:border-slate-600 transition-all appearance-none pr-10 shadow-sm"
                            disabled={isExporting}
                        >
                            {availableQualities.map(q => {
                                const val = typeof q === 'string' ? q : q.quality;
                                const label = typeof q === 'string' ? q : q.label;
                                return (
                                    <option key={val} value={val}>
                                        {label} {(val === '720p' || val === '1080p') && typeof q === 'string' ? '(HD)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs group-hover/select:text-indigo-500 transition-colors">▼</div>
                        {/* Size Disclaimer */}
                        <span className="absolute -bottom-6 right-0 text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wide h-4 flex items-center justify-end w-full whitespace-nowrap">
                            *Sizes are estimated. Actual size may vary.
                        </span>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className={`
                            px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all transform active:scale-95 w-full md:w-auto
                            ${isExporting
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 min-w-[220px]'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-slate-200 shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/20'
                            }
                        `}
                    >
                        {isExporting ? (
                            <div className="flex flex-col w-full gap-1.5 min-w-[180px]">
                                <div className="flex items-center justify-between text-[11px] font-black w-full uppercase tracking-wider">
                                    <span>{downloadStatus || "Processing..."}</span>
                                    <span>{downloadProgress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-300 rounded-full animate-pulse"
                                        style={{ width: `${downloadProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download Reel
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
