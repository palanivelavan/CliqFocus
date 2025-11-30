// backend/src/routes/timelogs.js
const express = require('express');
const router = express.Router();
const Timelog = require('../models/Timelog');

router.get('/', async (req, res) => {
    try {
        const owner = req.query.owner;
        const date = req.query.date;
        const q = {};

        if (owner) q.ownerZohoId = owner;

        if (date) {
            const from = new Date(`${date}T00:00:00.000Z`);
            const to = new Date(`${date}T23:59:59.999Z`);
            q.startTs = { $gte: from, $lte: to };
        }

        const logs = await Timelog.find(q).sort({ startTs: -1 });
        res.json(logs);

    } catch (err) {
        console.error("Timelog route error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
