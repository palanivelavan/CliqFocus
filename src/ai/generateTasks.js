const axios = require('axios');

async function generateTasks(goalText = 'General tasks for the day') {
    if (!process.env.OPENAI_API_KEY) {
        // deterministic fallback generator
        return [
            { title: `${goalText} — Plan & Research`, duration_min: 30 },
            { title: `${goalText} — Implement`, duration_min: 60 },
            { title: `${goalText} — Test & Fix`, duration_min: 30 },
            { title: `${goalText} — Review & Wrap-up`, duration_min: 20 }
        ];
    }

    const prompt = `You are a task generator. Given the goal: "${goalText}", produce an array of 4-6 tasks in JSON format: [{"title":"...", "duration_min":30}, ...]. Keep durations realistic in minutes.`;

    const payload = {
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: 'You are a helpful assistant that generates daily tasks.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 400
    };

    const res = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const text = res.data.choices?.[0]?.message?.content || '';
    // Attempt to parse JSON in the response. If parsing fails, fallback.
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
        // if not array, fallback:
    } catch (err) {
        // sometimes model returns non-JSON; fallback to simple parse heuristics
    }
    // fallback simple generator if parse fails
    return [
        { title: `${goalText} — Research`, duration_min: 30 },
        { title: `${goalText} — Build`, duration_min: 60 },
        { title: `${goalText} — Test`, duration_min: 30 },
        { title: `${goalText} — Wrap up`, duration_min: 15 }
    ];
}

module.exports = generateTasks;
