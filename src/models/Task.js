// backend/src/models/Task.js
const { mongoose } = require('./db-mongo');
const { Schema } = mongoose;

const taskSchema = new Schema({
    ownerZohoId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    durationMin: { type: Number, required: true },
    status: { type: String, default: 'scheduled', enum: ['scheduled', 'running', 'paused', 'completed', 'cancelled'] }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
