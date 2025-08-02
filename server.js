const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();

// Enhanced middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname))); // Better static file serving

// ⚠️ IMPORTANT: Replace with your actual API key from Google AI Studio
const API_KEY = "AIzaSyAlddEqUHlyZy8TsAdRXESRqy5c4G2jz4k";

if (!API_KEY) {
    console.error("❌ ERROR: Please set your Google AI Studio API key in server.js");
    console.error("Get your key from: https://makersuite.google.com/app/apikey");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        apiKeySet: API_KEY && API_KEY !== "AIzaSyAlddEqUHlyZy8TsAdRXESRqy5c4G2jz4k"
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate cover letter endpoint
app.post('/generate', async (req, res) => {
    console.log('📝 Received generate request');
    
    try {
        const { resume, job } = req.body;

        // Validate input
        if (!resume || !job) {
            console.log('❌ Missing resume or job description');
            return res.status(400).json({ 
                error: 'Both resume and job description are required' 
            });
        }

        console.log('✅ Input validated, generating with Gemini...');
        
        // Use gemini-1.5-flash (more reliable than gemini-pro)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash"
        });

        const prompt = `Write a professional cover letter for this job application.

Requirements:
- Maximum 250 words
- Professional but friendly tone
- Highlight relevant experience from resume
- Tailor to job requirements
- Include specific examples

Resume:
${resume.substring(0, 2000)} // Limit resume length

Job Description:
${job.substring(0, 1000)} // Limit job description length

Write the cover letter:`;

        console.log('🤖 Calling Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Cover letter generated successfully');
        res.json({ letter: text });

    } catch (error) {
        console.error('❌ Error generating cover letter:', error.message);
        
        // Handle specific Google AI errors
        if (error.message?.includes('API_KEY_INVALID')) {
            return res.status(401).json({ 
                error: 'Invalid API key. Please check your Google AI Studio API key.' 
            });
        }
        
        if (error.message?.includes('PERMISSION_DENIED')) {
            return res.status(403).json({ 
                error: 'Permission denied. Please enable billing in Google Cloud Console or check API key permissions.' 
            });
        }
        
        if (error.message?.includes('QUOTA_EXCEEDED')) {
            return res.status(429).json({ 
                error: 'API quota exceeded. Please try again later.' 
            });
        }

        if (error.message?.includes('models/gemini')) {
            return res.status(400).json({ 
                error: 'Model not available. Using gemini-1.5-flash which should be available globally.' 
            });
        }

        res.status(500).json({ 
            error: 'Server error generating cover letter. Check server logs for details.',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} to use the cover letter generator`);
    console.log(`🔑 API Key configured: ${API_KEY ? 'Yes' : 'No'}`);
});