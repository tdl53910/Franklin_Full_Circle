// Vercel Serverless Function — dedicated dossier generation endpoint
// Uses the OpenAI SDK for reliability. Set OPENAI_API_KEY in Vercel env vars.

import OpenAI from 'openai';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });

    try {
        const { messages, max_tokens = 2500, temperature = 0.7 } = req.body;
        if (!Array.isArray(messages) || !messages.length) {
            return res.status(400).json({ error: 'Invalid request: messages must be a non-empty array' });
        }

        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            max_tokens,
            temperature,
        });

        return res.status(200).json(completion);
    } catch (err) {
        console.error('Dossier generation error:', err);
        return res.status(500).json({ error: err.message });
    }
}