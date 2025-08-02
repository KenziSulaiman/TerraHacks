const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();

// ✅ Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// 🔑 Your Google AI API Key
const API_KEY = "AIzaSyAlddEqUHlyZy8TsAdRXESRqy5c4G2jz4k";

if (!API_KEY) {
    console.error("❌ ERROR: Please set your Google AI Studio API key in server.js");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        apiKeySet: !!API_KEY
    });
});

// ✅ Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ✉️ Generate Cover Letter
app.post('/generate', async (req, res) => {
    console.log('📩 Received cover letter request');

    try {
        const { resume, job } = req.body;

        if (!resume || !job) {
            return res.status(400).json({ error: 'Both resume and job description are required' });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const prompt = `
Rewrite the following resume so that it is tailored specifically to the job description below.

🛠 Requirements:
- Match experience/skills with job description
- Use ATS-friendly language
- Keep resume sections like:
  * Contact Info
  * Professional Summary
  * Skills
  * Experience
  * Education
- Use bullet points for responsibilities/achievements
- Output as clean, professional **Markdown** (or HTML if possible)

📄 Resume:
${resume.substring(0, 3000)}

💼 Job Description:
${job.substring(0, 1500)}

Return the improved resume below:
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Cover letter generated');
        res.json({ letter: text });

    } catch (error) {
        console.error('❌ Cover letter error:', error.message);
        res.status(500).json({
            error: 'Failed to generate cover letter.',
            details: error.message
        });
    }
});

// 📄 Generate Tailored Resume
app.post('/generate-resume', async (req, res) => {
    console.log('📄 Received tailored resume request');

    try {
        const { resume, job } = req.body;

        if (!resume || !job) {
            return res.status(400).json({ error: 'Both resume and job description are required' });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const prompt = `Rewrite the following resume to tailor it specifically to the job description. 
Focus on aligning skills, experience, and accomplishments with what the job is asking for.

Maintain proper resume formatting (headers, bullet points, etc.). 
Use keywords from the job description and optimize for ATS (Applicant Tracking Systems).

Resume:
${resume.substring(0, 3000)}

Job Description:
${job.substring(0, 1500)}

Return only the improved resume below:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Tailored resume generated');
        res.json({ resume: text });

    } catch (error) {
        console.error('❌ Resume generation error:', error.message);
        res.status(500).json({
            error: 'Failed to generate tailored resume.',
            details: error.message
        });
    }
});

// 🧯 Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
