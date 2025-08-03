const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// ⚠️ Replace this with your actual Gemini API key
const API_KEY = "AIzaSyAlddEqUHlyZy8TsAdRXESRqy5c4G2jz4k";

if (!API_KEY) {
    console.error("❌ ERROR: Please set your Google AI Studio API key in server.js");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        apiKeySet: !!API_KEY
    });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// POST /generate-cover-letter
app.post('/generate-cover-letter', async (req, res) => {
    try {
        const { resume, job } = req.body;

        if (!resume || !job) {
            return res.status(400).json({ error: 'Both resume and job description are required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Write a professional cover letter for this job application.

Requirements:
- Maximum 250 words
- Professional but friendly tone
- Highlight relevant experience from resume
- Tailor to job requirements
- Include specific examples

Resume:
${resume}

Job Description:
${job}

Write the cover letter:`;


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        if (!text || typeof text !== 'string') {
            return res.status(500).json({ error: 'Gemini returned no cover letter content.' });
        }

        res.json({ letter: text });

    } catch (error) {
        console.error('❌ Error generating cover letter:', error.message);
        res.status(500).json({ error: 'Server error generating cover letter.', details: error.message });
    }
});

// POST /generate-resume
app.post('/generate-resume', async (req, res) => {
    try {
        const { resume, job } = req.body;

        if (!resume || !job) {
            return res.status(400).json({ error: 'Both resume and job description are required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a resume optimization assistant. Tailor the following resume to the job description.

⚠️ Follow this exact **section order** and **heading names**. If content is unavailable, leave the section empty or write "Available upon request":

1. First Name, Family Name · Program Name & Academic Level 
2. Contact Information: email · phone · LinkedIn/professional website
3. Summary of Qualifications (3–5 bullet points using [Adjective/noun] + [high level description])
4. Education: degree, institution, dates; relevant courses or projects
5. [Relevant Skill or Experience Heading 1] (e.g. Customer Service)
6. [Relevant Skill or Experience Heading 2]
7. [Relevant Skill or Experience Heading 3] (up to 5 total)
8. Experience Summary: job titles, organizations, dates (reverse chronological, no bullet details)
9. Other Sections (e.g. Technical Skills, Certifications) - optional
10. Activities and Interests (volunteer, extracurricular, hobbies, etc.)

Use ATS‑friendly language and stay within 1–2 pages. Do not add or omit sections except for section 9. Do not explain — return only the resume formatted accordingly.

📄 Resume:
${resume}

💼 Job Description:
${job}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        if (!text || typeof text !== 'string') {
            return res.status(500).json({ error: 'Gemini returned no resume content.' });
        }

        res.json({ resume: text });

    } catch (error) {
        console.error('❌ Error generating tailored resume:', error.message);
        res.status(500).json({ error: 'Server error generating resume.', details: error.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
