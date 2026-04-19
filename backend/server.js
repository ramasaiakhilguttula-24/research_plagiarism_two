
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ============================================================================
// JOB QUEUE SYSTEM (Async Job Processing)
// ============================================================================
const jobs = {}; // Store job status: jobs[jobId] = { status, progress, results, error, filePath }

function createJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

app.get("/", (req, res) => {
    res.send("Research Plagiarism Backend is Running 🚀 (with Async Job Processing)");
});

// Get job status endpoint
app.get('/api/status/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) {
        return res.status(404).json({ error: 'Job not found', jobId: req.params.jobId });
    }
    
    const response = {
        jobId: req.params.jobId,
        status: job.status,
        progress: job.progress || 0,
        message: job.message || '',
    };
    
    // Include results if complete
    if (job.status === 'completed') {
        response.results = job.results;
    }
    
    // Include error if failed
    if (job.status === 'failed') {
        response.error = job.error;
    }
    
    res.json(response);
});

// Upload configuration
const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
});

// Create uploads dir
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/api/scan', upload.single('file'), (req, res) => {
    console.log('[Upload] Request received');
    console.log('[Upload] File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'None');
    
    if (!req.file) {
        console.error('[Upload] ERROR: No file received');
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create a unique job ID
    const jobId = createJobId();
    const filePath = req.file.path;
    
    // Initialize job
    jobs[jobId] = {
        status: 'processing',
        progress: 0,
        message: 'Initializing analysis...',
        results: null,
        error: null,
        filePath: filePath,
        startTime: Date.now()
    };

    console.log(`[${jobId}] Created job for file ${filePath} (${req.file.size} bytes)`);

    // Return job ID immediately (HTTP 202 Accepted)
    res.status(202).json({
        jobId: jobId,
        status: 'processing',
        message: 'Analysis started. Poll /api/status/:jobId for progress.'
    });

    // Process in background (don't await)
    setImmediate(() => {
        analyzeInBackground(jobId, filePath);
    });
});

// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        console.error('[Multer Error]', error.message);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
        return res.status(400).json({ error: error.message });
    } else if (error) {
        console.error('[Upload Error]', error);
        return res.status(500).json({ error: 'Upload failed', details: error.message });
    }
    next();
});

// ============================================================================
// Background Analysis Function (Async Processing)
// ============================================================================
function analyzeInBackground(jobId, filePath) {
    const pythonScript = path.join(__dirname, 'python', 'analyzer.py');
    const pythonCommand = process.env.PYTHON_PATH || 'python';

    console.log(`Starting background analysis for job ${jobId}...`);

    const pythonProcess = spawn(pythonCommand, [pythonScript, filePath, '--job-id', jobId], {
        env: { ...process.env }
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        dataString += output;
        console.log(`[${jobId}] Python stdout:`, output.slice(0, 200));
        
        // Check for progress updates (lines starting with PROGRESS:)
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.startsWith('PROGRESS:')) {
                const progressData = JSON.parse(line.substring(9));
                if (jobs[jobId]) {
                    jobs[jobId].progress = progressData.progress;
                    jobs[jobId].message = progressData.message;
                    console.log(`[${jobId}] Progress: ${progressData.progress}% - ${progressData.message}`);
                }
            }
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        errorString += error;
        console.error(`[${jobId}] Python Error: ${error}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`[${jobId}] Python process exited with code ${code}`);

        // Clean up uploaded file
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[${jobId}] Cleaned up file`);
            }
        } catch (err) {
            console.error(`[${jobId}] Error deleting file:`, err);
        }

        if (code !== 0) {
            console.error(`[${jobId}] Analysis failed:`, errorString);
            if (jobs[jobId]) {
                jobs[jobId].status = 'failed';
                jobs[jobId].error = errorString || 'Analysis process failed';
                jobs[jobId].progress = 0;
            }
            return;
        }

        try {
            console.log(`[${jobId}] Raw Python Output (first 500 chars):`, dataString.slice(0, 500));
            
            // Filter out PROGRESS lines - they start with "PROGRESS:"
            // Extract only the JSON part (last JSON object in output)
            const lines = dataString.split('\n');
            let jsonString = '';
            
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                
                // Skip empty lines and progress lines
                if (!line || line.startsWith('PROGRESS:')) {
                    continue;
                }
                
                // Try to find valid JSON (usually the last non-PROGRESS line)
                if (line.startsWith('{')) {
                    jsonString = line;
                    break;
                }
            }
            
            if (!jsonString) {
                throw new Error('No JSON output found from analyzer. Raw output: ' + dataString);
            }
            
            console.log(`[${jobId}] Extracted JSON (first 200 chars):`, jsonString.slice(0, 200));
            const results = JSON.parse(jsonString);
            
            if (jobs[jobId]) {
                jobs[jobId].status = 'completed';
                jobs[jobId].results = results;
                jobs[jobId].progress = 100;
                jobs[jobId].message = 'Analysis complete';
                console.log(`[${jobId}] Job completed successfully`);
                
                // Clean up old jobs after 1 hour
                setTimeout(() => {
                    delete jobs[jobId];
                    console.log(`[${jobId}] Job cleaned from memory`);
                }, 3600000);
            }
        } catch (e) {
            console.error(`[${jobId}] Failed to parse Python output:`, e.message);
            console.error(`[${jobId}] Raw dataString:`, dataString);
            console.error(`[${jobId}] Python stderr was:`, errorString);
            
            if (jobs[jobId]) {
                jobs[jobId].status = 'failed';
                jobs[jobId].error = `Parse error: ${e.message}`;
                jobs[jobId].progress = 0;
            }
        }
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Job queue system active`);
    console.log(`📡 CORS enabled for all origins`);
    console.log(`📝 Upload directory: ${path.resolve('uploads')}`);
});
