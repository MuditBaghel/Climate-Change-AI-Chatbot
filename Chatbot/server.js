const express = require('express');
const session = require('express-session');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

const genAI = new GoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyD_JoMqSk_D7gh39e6pDjgv5QvT2oT_tic', // Securely store in .env
});

const model = 'gemini-2.5-pro-preview-03-25';
const config = {
    thinkingConfig: { thinkingBudget: 0 },
    tools: [{ functionDeclarations: [] }],
    responseMimeType: 'text/plain',
};

// Initial system prompt defining the chatbot’s role
const initialPrompt = {
    role: 'user',
    parts: [{
        text: `You are a climate change awareness chatbot designed to educate users about climate change, its causes, effects, and mitigation strategies. Your primary topics include global warming, greenhouse gases, renewable energy, carbon footprint, deforestation, and extreme weather events. Use a friendly and engaging tone to make the information approachable. Provide accurate, science-based information and suggest practical actions users can take to reduce their environmental impact. Explain complex concepts in simple terms. If asked, provide sources from reputable organizations like the IPCC, NASA, or the EPA. Handle skepticism politely by presenting scientific evidence. Acknowledge users' concerns and emphasize the positive impact of actions. Do not speculate or provide unverified info. Incorporate interactive elements like quizzes.`
    }],
};

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    // Initialize or retrieve conversation history from session
    if (!req.session.contents) {
        req.session.contents = [initialPrompt];
    }

    // Add user message to history
    req.session.contents.push({
        role: 'user',
        parts: [{ text: userMessage }],
    });

    try {
        const response = await genAI.getGenerativeModel({ model }).generateContentStream({
            contents: req.session.contents,
            ...config,
        });

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullResponse = '';
        for await (const chunk of response.stream) {
            const text = chunk.text();
            fullResponse += text;
            res.write(`data: ${text}\n\n`);
        }

        // Add AI response to history once complete
        req.session.contents.push({
            role: 'model',
            parts: [{ text: fullResponse }],
        });

        res.end();
    } catch (error) {
        console.error(error);
        res.write(`data: Oops! Something went wrong. Please try again.\n\n`);
        res.end();
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));