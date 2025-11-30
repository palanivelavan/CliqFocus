// backend/src/models/Timelog.js
const { mongoose } = require('./db-mongo');
const { Schema } = mongoose;

const timelogSchema = new Schema({
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    ownerZohoId: { type: String, index: true },
    startTs: Date,
    endTs: Date,
    durationMin: Number
}, { timestamps: true });

module.exports = mongoose.model('Timelog', timelogSchema);
