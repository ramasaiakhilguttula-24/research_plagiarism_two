import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

// ✅ Production-safe API base
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default function UploadZone({ onAnalysisStart, onAnalysisComplete, onAnalysisError, isAnalyzing }) {
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (
            file.type !== 'application/pdf' &&
            file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            toast.error('Please upload a PDF or DOCX file.');
            return;
        }

        if (!API_BASE_URL) {
            toast.error("API URL not configured.");
            return;
        }

        onAnalysisStart();
        setUploadProgress(10);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const interval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 5, 90));
            }, 500);

            const response = await axios.post(
                `${API_BASE_URL}/api/scan`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );

            clearInterval(interval);
            setUploadProgress(100);

            setTimeout(() => {
                onAnalysisComplete(response.data);
            }, 500);

        } catch (error) {
            console.error(error);

            const errorMsg =
                error.response?.data?.details ||
                error.response?.data?.error ||
                'Analysis failed. Please try again.';

            toast.error(`Error: ${errorMsg}`, { duration: 6000 });

            if (onAnalysisError) {
                onAnalysisError();
            }

            setUploadProgress(0);
        }
    }, [onAnalysisStart, onAnalysisComplete, onAnalysisError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        disabled: isAnalyzing
    });

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ease-in-out",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isDragActive ? "border-primary bg-primary/10 scale-[1.02]" : "border-white/10 bg-black/20",
                    isAnalyzing && "pointer-events-none opacity-80"
                )}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center text-center space-y-6">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative bg-card p-4 rounded-2xl border border-white/10 shadow-2xl">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                </div>
                            </div>
                            <div className="mt-8 space-y-2">
                                <h3 className="text-xl font-semibold text-white">Analyzing Document...</h3>
                                <p className="text-muted-foreground text-sm">
                                    Scanning for matches across millions of sources
                                </p>
                                <div className="w-64 h-2 bg-secondary rounded-full mt-4 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-4 ring-black/20">
                                <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                                    {isDragActive ? "Drop file to scan" : "Drag & drop your file here"}
                                </h3>
                                <p className="text-muted-foreground">
                                    Supports .PDF and .DOCX (Max 20MB)
                                </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted-foreground/60 font-mono mt-4">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Secure Upload
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> SSL Encrypted
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}