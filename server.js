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

        const prompt = `Write a professional cover letter for this job application.

Requirements:
- Maximum 250 words
- Professional but friendly tone
- Highlight relevant experience from resume
- Tailor to job requirements
- Include specific examples
- At the end of the cover letter include the name of the person applying.

Resume:
${resume}

Job Description:
${job}

Write the cover letter:`;

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

        const prompt = `
You are a resume optimization assistant.

Take the resume provided below and tailor it specifically to the job description that follows. Focus on aligning relevant skills, experience, and tone to the job posting.

⚠️ IMPORTANT: Structure the improved resume using the **exact section order and headings** below. If a section has no content, leave it blank or write "Available upon request".

---

📄 STRUCTURE:

 Summary of Qualifications
- Use 3–5 bullet points.
- Each bullet should follow this format:
  - [Adjective/noun] + [high level description of experience or attribute]
  - E.g., “Strong interpersonal skills demonstrated through peer mentorship and front-desk customer service roles.”

 Education
- Include institution, degree/diploma, expected/completed graduation year.
- Add relevant courses or projects if useful.

 [Skill or Experience Heading 1]
 [Skill or Experience Heading 2]
 [Skill or Experience Heading 3]
- For these sections:
  - Use skill names as headings (e.g., "Leadership", "Customer Service", "Technical Writing")
  - Under each heading, include bullet points of related achievements/tasks
  - 2–4 bullets per heading

 Experience Summary
- List job titles, organizations, and dates only (no bullet details)
- In reverse chronological order

 Activities and Interests
- Include extracurriculars, volunteer roles, personal development
- Hobbies can be listed at the end, separated by commas

---

🎯 Tone: Clear, professional, ATS-friendly

Now tailor the following resume using the structure above:

---

📄 Resume:
${resume}

💼 Job Description:
${job}

---

Return the improved resume only — no explanation. Make sure it follows the exact section order.
`;


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
