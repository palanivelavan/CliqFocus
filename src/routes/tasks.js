// backend/src/routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { scheduleTask } = require('../scheduler/timerService');

// Create a task
router.post('/', async (req, res) => {
    try {
        const { zohoUserId, title, startTime, durationMin } = req.body;
        if (!zohoUserId || !title || !startTime || !durationMin) {
            return res.status(400).json({ error: "Missing fields" });
        }

        const task = new Task({
            ownerZohoId: zohoUserId,
            title,
            startTime: new Date(startTime),
            durationMin
        });

        await task.save();

        // schedule timer
        scheduleTask(task._id.toString(), task.startTime, task.durationMin, task.ownerZohoId);

        res.status(201).json({ id: task._id, status: "scheduled" });

    } catch (err) {
        console.error("Error creating task:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get tasks for a day
router.get('/', async (req, res) => {
    try {
        const date = req.query.date;
        const owner = req.query.owner;

        if (!date) return res.status(400).json({ error: "date=YYYY-MM-DD required" });

        const from = new Date(`${date}T00:00:00.000Z`);
        const to = new Date(`${date}T23:59:59.999Z`);

        const query = { startTime: { $gte: from, $lte: to } };
        if (owner) query.ownerZohoId = owner;

        const tasks = await Task.find(query).sort({ startTime: 1 });
        res.json(tasks);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
