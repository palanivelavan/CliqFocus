// backend/src/models/User.js
const { mongoose } = require('./db-mongo');
const { Schema } = mongoose;

const userSchema = new Schema({
    zohoUserId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    timezone: { type: String, default: 'UTC' },
    preferences: { type: Object, default: {} },
    oauth: { type: Object, default: {} },
    lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
