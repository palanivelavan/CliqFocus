// backend/src/scheduler/timerService.js
const Task = require('../models/Task');
const Timelog = require('../models/Timelog');
const { postBotMessage } = require('../utils/cliq');

const timers = new Map(); // taskId -> { startTimeout, endTimeout }

function msUntil(iso) {
    return Math.max(0, new Date(iso).getTime() - Date.now());
}

async function scheduleTask(taskId, isoStartTime, durationMin, ownerZohoId) {
    // clear existing
    cancelTask(taskId);

    const startDelay = msUntil(isoStartTime);
    const durationMs = Math.max(1, Number(durationMin)) * 60 * 1000;

    // when start arrives, mark running and schedule end
    const startTimeout = setTimeout(async () => {
        try {
            await Task.findByIdAndUpdate(taskId, { status: 'running' });
        } catch (e) { console.error(e); }
        const endTimeout = setTimeout(async () => {
            try {
                await Task.findByIdAndUpdate(taskId, { status: 'completed' });
                // write timelog
                const tl = new Timelog({
                    taskId,
                    ownerZohoId,
                    startTs: new Date(isoStartTime),
                    endTs: new Date(),
                    durationMin
                });
                await tl.save();
                // notify via bot
                await postBotMessage(ownerZohoId, `⏰ Focus finished for task ${taskId}.`);
            } catch (err) {
                console.error('Error in endTimeout', err);
            }
        }, durationMs);
        timers.set(taskId + ':end', endTimeout);
    }, startDelay);

    timers.set(taskId + ':start', startTimeout);
}

function cancelTask(taskId) {
    const s = timers.get(taskId + ':start');
    const e = timers.get(taskId + ':end');
    if (s) { clearTimeout(s); timers.delete(taskId + ':start'); }
    if (e) { clearTimeout(e); timers.delete(taskId + ':end'); }
}

// on server start: recover scheduled tasks from DB
async function recoverScheduledTasks() {
    const tasks = await Task.find({ status: { $in: ['scheduled', 'running'] } });
    for (const t of tasks) {
        // compute remaining and reschedule
        scheduleTask(t._id.toString(), t.startTime.toISOString(), t.durationMin, t.ownerZohoId);
    }
}

module.exports = { scheduleTask, cancelTask, recoverScheduledTasks };
