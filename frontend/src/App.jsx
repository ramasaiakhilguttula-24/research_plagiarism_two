import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import UploadZone from './components/UploadZone'
import ResultsViewer from './components/ResultsViewer'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const resetScan = () => {
    setResults(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen gradient-bg text-foreground font-sans relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex items-center justify-between glass-panel border-b border-white/10">
        <div className="flex items-center gap-3" onClick={resetScan} style={{ cursor: 'pointer' }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M8 15l4 3 4-3" /></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            PlagiScan
          </h1>
        </div>
        <div className="flex gap-4">
          {/* Nav items or user profile could go here */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 max-w-5xl">
        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center mb-10 space-y-4">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  Check your paper for <span className="text-primary">originality</span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Advanced AI-powered plagiarism detection with detailed source analysis and color-coded results.
                </p>
              </div>

              <UploadZone
                onAnalysisStart={() => setIsAnalyzing(true)}
                onAnalysisComplete={(data) => {
                  setResults(data);
                  setIsAnalyzing(false);
                }}
                onAnalysisError={() => setIsAnalyzing(false)}
                isAnalyzing={isAnalyzing}
              />
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ResultsViewer results={results} onReset={resetScan} />
              {/* Debug log */}
              {console.log("Rendering results:", results)}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      />
    </div>
  )
}

export default App
