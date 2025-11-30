// backend/src/routes/widgetWebhook.js
const User = require('../models/User');
const Task = require('../models/Task');
const generateTasks = require('../ai/generateTasks');
const { scheduleTask, cancelTask } = require('../scheduler/timerService');

module.exports = async (req, res) => {
    try {
        const payload = req.body || {};
        const action = payload.action;
        const zohoUserId = payload.user?.id || payload.user?.user_id || "unknown";

        // Upsert user (keep basic info)
        if (zohoUserId) {
            await User.findOneAndUpdate(
                { zohoUserId },
                { $set: { name: payload.user?.name || payload.user?.display_name || 'User', lastSeen: new Date() } },
                { upsert: true, new: true }
            );
        }

        // If a widget action arrived (button click)
        if (action) {
            const actionId = action.id || action.name || (typeof action === 'string' ? action : null);

            // START TASK
            if (actionId === 'start_task' || actionId === 'start') {
                const taskId = action.task_id || action.metadata?.task_id || action.metadata?.taskId;
                if (!taskId) return res.status(400).json({ status: 'error', message: 'task_id missing' });

                const task = await Task.findById(taskId);
                if (!task) return res.status(404).json({ status: 'error', message: 'task not found' });

                scheduleTask(task._id.toString(), task.startTime, task.durationMin, task.ownerZohoId);
                return res.json({ status: 'ok', message: `Started timer for "${task.title}"` });
            }

            // STOP TASK
            if (actionId === 'stop_task' || actionId === 'stop') {
                const taskId = action.task_id || action.metadata?.task_id;
                if (!taskId) return res.status(400).json({ status: 'error', message: 'task_id missing' });

                cancelTask(taskId);
                await Task.findByIdAndUpdate(taskId, { status: 'cancelled' }).catch(() => { });
                return res.json({ status: 'ok', message: 'Timer stopped' });
            }

            // GENERATE TASKS (AI)
            if (actionId === 'generate_tasks' || actionId === 'gen_tasks') {
                let tasks;
                try {
                    const goal = payload.user_goal || action.metadata?.goal || 'Plan for today';
                    tasks = await generateTasks(goal);
                } catch (err) {
                    console.warn('AI generate failed, using fallback', err);
                    tasks = [{ title: 'Sample Task', durationMin: 25 }];
                }

                // Return a widget JSON showing generated tasks
                return res.json({
                    status: 'ok',
                    widget: {
                        tabs: [
                            {
                                name: 'AI Tasks',
                                sections: [
                                    {
                                        title: 'Generated Tasks',
                                        elements: tasks.map((t, i) => ({
                                            type: 'text',
                                            content: `• ${t.title} — ${t.durationMin} min`
                                        }))
                                    },
                                    {
                                        title: 'Actions',
                                        elements: [
                                            {
                                                type: 'buttons',
                                                buttons: tasks.map((t, i) => ({
                                                    id: `gen_start_${i}`,
                                                    label: `Start: ${t.durationMin}m`,
                                                    action: { name: 'start_task', metadata: { title: t.title, durationMin: t.durationMin } }
                                                }))
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });
            }

            // Unknown action
            return res.json({ status: 'error', message: 'unknown action' });
        }

        // Default: widget open — list today's tasks
        const today = new Date().toISOString().slice(0, 10);
        const from = new Date(`${today}T00:00:00.000Z`);
        const to = new Date(`${today}T23:59:59.999Z`);

        const tasks = zohoUserId
            ? await Task.find({ ownerZohoId: zohoUserId, startTime: { $gte: from, $lte: to } }).sort({ startTime: 1 })
            : [];

        const elements = [
            { type: 'text', content: 'Welcome to CliqFocus — your Pomodoro + time tracker.' },
            {
                type: 'buttons',
                buttons: [
                    { id: 'generate_tasks', label: 'Generate Tasks (AI)', action: { name: 'generate_tasks' } }
                ]
            }
        ];

        if (tasks.length === 0) {
            elements.push({ type: 'text', content: 'No tasks scheduled for today.' });
        } else {
            for (const t of tasks) {
                elements.push({ type: 'text', content: `• ${t.title} — ${t.durationMin}m (${new Date(t.startTime).toLocaleTimeString()})` });
                elements.push({
                    type: 'buttons',
                    buttons: [
                        { id: 'start_task', label: 'Start', action: { name: 'start_task', task_id: t._id.toString() } },
                        { id: 'stop_task', label: 'Stop', action: { name: 'stop_task', task_id: t._id.toString() } }
                    ]
                });
            }
        }

        return res.json({
            status: 'ok',
            widget: {
                tabs: [
                    { name: 'Today', sections: [{ title: 'Focus Planner', elements }] }
                ]
            }
        });

    } catch (err) {
        console.error('widgetWebhook error:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
};
