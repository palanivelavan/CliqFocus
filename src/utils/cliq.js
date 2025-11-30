const axios = require('axios');

async function postBotMessage(target, text) {
    const url = process.env.ZOHO_BOT_INCOMING_URL;
    if (!url) {
        console.warn('ZOHO_BOT_INCOMING_URL not set; skipping bot msg:', text);
        return;
    }
    try {
        await axios.post(url, { text }, { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        console.error('postBotMessage error', err.response?.data || err.message);
    }
}
module.exports = { postBotMessage };
