// backend/src/routes/botWebhook.js
const Task = require('../models/Task');
const { scheduleTask } = require('../scheduler/timerService');

module.exports = async (req, res) => {
    try {
        const payload = req.body || {};
        const text = (payload.text || '').trim();
        const user = payload.user || payload.from || {};

        // Simple command: "start <taskId>"
        if (/^start\s+\S+/i.test(text)) {
            const parts = text.split(/\s+/);
            const taskId = parts[1];
            const task = await Task.findById(taskId);
            if (!task) return res.json({ text: 'Task not found.' });

            scheduleTask(task._id.toString(), task.startTime, task.durationMin, task.ownerZohoId);
            return res.json({ text: `Started timer for "${task.title}"` });
        }

        // Fallback help message
        return res.json({ text: 'Commands: start <taskId>' });

    } catch (err) {
        console.error('botWebhook error:', err);
        return res.json({ text: 'Bot error: ' + err.message });
    }
};
