
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

app.get("/", (req, res) => {
    res.send("Research Plagiarism Backend is Running 🚀");
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
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const pythonScript = path.join(__dirname, 'python', 'analyzer.py');

    // Use PYTHON_PATH from env or default to 'python'
    const pythonCommand = process.env.PYTHON_PATH || 'python';

    console.log(`Starting analysis for ${filePath}...`);

    const pythonProcess = spawn(pythonCommand, [pythonScript, filePath], {
        env: { ...process.env } // Pass env vars like GOOGLE_API_KEY
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);

        // Clean up uploaded file
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error("Error deleting file:", err);
        }

        if (code !== 0) {
            console.error("Analysis failed:", errorString);
            return res.status(500).json({
                error: 'Analysis failed',
                details: errorString || 'Check server logs for details',
                code: code
            });
        }

        try {
            console.log("Python Output (Success):", dataString.slice(0, 500)); // Log first 500 chars
            const results = JSON.parse(dataString);
            res.json(results);
        } catch (e) {
            console.error("Failed to parse Python output:", dataString);
            console.error("Python stderr was:", errorString);
            res.status(500).json({
                error: 'Invalid response from analyzer',
                raw: dataString,
                stderr: errorString
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
