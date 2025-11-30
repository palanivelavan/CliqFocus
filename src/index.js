// backend/src/index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

// MongoDB connection
const { connectMongo } = require('./models/db-mongo');

// Scheduler recovery
const { recoverScheduledTasks } = require('./scheduler/timerService');

// ROUTES
const tasksRouter = require('./routes/tasks');
const timelogsRouter = require('./routes/timelogs');
const widgetWebhook = require('./routes/widgetWebhook');
const botWebhook = require('./routes/botWebhook');

const app = express();
app.use(bodyParser.json());

/* ----------------------------------------
   DEMO PAGE (for browser testing)
----------------------------------------- */
app.get('/demo', (req, res) => {
  res.send(`
    <html>
      <head><title>CliqFocus Demo</title></head>
      <body style="font-family: Arial; padding:20px;">
        <h1>CliqFocus Backend Running</h1>
        <p>Server Time: ${new Date().toISOString()}</p>

        <h3>Useful Endpoints:</h3>
        <ul>
          <li><a href="/health">/health</a></li>
          <li><a href="/api/tasks?date=${new Date().toISOString().slice(0, 10)}">Today's Tasks</a></li>
        </ul>

        <p>This backend is meant for Zoho Cliq extensions — not public website UI.</p>
      </body>
    </html>
  `);
});

/* ----------------------------------------
   HEALTH ENDPOINT
----------------------------------------- */
app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

/* ----------------------------------------
   API ROUTES
----------------------------------------- */
app.use('/api/tasks', tasksRouter);
app.use('/api/timelogs', timelogsRouter);

/* ----------------------------------------
   WIDGET & BOT WEBHOOKS
----------------------------------------- */
app.post('/api/webhook/widget', widgetWebhook);
app.post('/api/webhook/bot', botWebhook);

/* ----------------------------------------
   404 FALLBACK
----------------------------------------- */
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

/* ----------------------------------------
   START SERVER + TIMER RECOVERY
----------------------------------------- */
const PORT = process.env.PORT || 4000;

connectMongo()
  .then(async () => {
    console.log("MongoDB connected");

    // 🔥 Recover all scheduled timers on restart
    await recoverScheduledTasks();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`CliqFocus backend listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Mongo connection failed:", err);
    process.exit(1);
  });
