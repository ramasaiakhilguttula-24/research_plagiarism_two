import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ArrowLeft, ExternalLink, AlertTriangle, Check, Copy } from 'lucide-react'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

export default function ResultsViewer({ results, onReset }) {
    const [selectedHighlight, setSelectedHighlight] = useState(null);
    const [activeTab, setActiveTab] = useState('plagiarism'); // 'plagiarism' | 'ai'

    // Safety check for results structure
    if (!results) return <div className="text-white text-center p-10">No results data available.</div>;

    if (results.error) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-10 p-6 bg-red-900/20 border border-red-500/50 rounded-2xl text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Analysis Error</h3>
                <p className="text-red-200">{results.error}</p>
                <div className="mt-4 text-xs text-left bg-black/50 p-4 rounded overflow-auto max-h-40 font-mono text-gray-400">
                    {results.stderr || results.details || "No details provided"}
                </div>
                <button onClick={onReset} className="mt-6 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg transition-colors">
                    Try Again
                </button>
            </div>
        )
    }

    const segments = results.segments || [];
    const totalScore = results.score || 0;
    const aiScore = results.ai_probability || 0;

    if (segments.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto mt-10 p-6 bg-yellow-900/20 border border-yellow-500/50 rounded-2xl text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Text Extracted</h3>
                <p className="text-yellow-200">We couldn't extract any readable text from this document. It might be an image-only PDF or scanned document.</p>
                <button onClick={onReset} className="mt-6 bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg transition-colors">
                    Try Another File
                </button>
            </div>
        )
    }

    // Render text with highlights
    const renderDocument = () => {
        return (
            <div className="font-serif leading-relaxed text-lg text-white/90 whitespace-pre-wrap">
                {segments.map((seg, idx) => {
                    // Determine color based on similarity
                    let bgClass = "bg-transparent";
                    if (seg.is_plagiarized) {
                        if (seg.similarity > 0.7) bgClass = "bg-red-500/30 border-b-2 border-red-500 hover:bg-red-500/40 cursor-pointer";
                        else if (seg.similarity > 0.2) bgClass = "bg-yellow-500/30 border-b-2 border-yellow-500 hover:bg-yellow-500/40 cursor-pointer";
                        else bgClass = "bg-green-500/20"; // Safe?
                    }

                    return (
                        <span
                            key={idx}
                            className={cn("transition-colors rounded-sm px-0.5 py-0.5", bgClass)}
                            onClick={() => seg.is_plagiarized && setSelectedHighlight(seg)}
                        >
                            {seg.text}
                        </span>
                    )
                })}
            </div>
        );
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    }

    return (
        <div className="w-full">
            {/* Top Bar for Navigation */}
            <div className="flex items-center justify-between mb-8 animate-in slide-in-from-top-4 duration-500">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Upload
                </button>
                <div className="flex gap-2">
                    <button className="bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => toast("Export feature coming soon!")}>
                        Export PDF
                    </button>
                    <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" onClick={onReset}>
                        New Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Document View */}
                <div className="lg:col-span-8 order-2 lg:order-1">
                    <div className="bg-card/50 border border-white/10 rounded-3xl p-8 min-h-[600px] shadow-2xl backdrop-blur-sm relative overflow-hidden">
                        {/* Paper header style */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-600 opacity-50" />

                        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="font-semibold text-xl text-white">Document Analysis</h3>
                            <div className="flex gap-2 text-xs">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full" /> Critical Match</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full" /> Moderate</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full" /> Original</div>
                            </div>
                        </div>

                        {renderDocument()}
                    </div>
                </div>

                {/* Sidebar Panel */}
                <div className="lg:col-span-4 order-1 lg:order-2 space-y-6">

                    {/* Score Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors" />
                            <span className="text-4xl font-black text-white relative z-10">{totalScore}%</span>
                            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider relative z-10">Plagiarism</span>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                            <span className="text-4xl font-black text-white relative z-10">{Math.round(aiScore * 100)}%</span>
                            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider relative z-10">AI Likelihood</span>
                        </motion.div>
                    </div>

                    {/* Source Detail Box (Dynamic) */}
                    <AnimatePresence mode="wait">
                        {selectedHighlight ? (
                            <motion.div
                                key="source-detail"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-card border border-white/10 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-white flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500" /> Match Found
                                    </h4>
                                    <button onClick={() => setSelectedHighlight(null)} className="text-muted-foreground hover:text-white">&times;</button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <p className="text-sm text-white/80 italic line-clamp-3">"{selectedHighlight.text}"</p>
                                    </div>

                                    {selectedHighlight.source && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground uppercase font-semibold">Source</span>
                                                <div className="h-px bg-white/10 flex-1" />
                                            </div>
                                            <a
                                                href={selectedHighlight.source.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block group"
                                            >
                                                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                                                    <div className="mt-1">
                                                        <ExternalLink className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-primary group-hover:text-white transition-colors text-sm line-clamp-1">{selectedHighlight.source.title || "Unknown Source"}</p>
                                                        <p className="text-xs text-muted-foreground break-all line-clamp-1 group-hover:text-white/70">{selectedHighlight.source.url}</p>
                                                    </div>
                                                </div>
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-2" onClick={() => copyToClipboard(selectedHighlight.text)}>
                                            <Copy className="w-3 h-3" /> Copy Text
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-card/30 border border-white/5 rounded-3xl p-8 text-center border-dashed">
                                <p className="text-muted-foreground text-sm">Select any color-coded text segment to see source details.</p>
                            </div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    )
}
