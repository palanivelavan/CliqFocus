// backend/src/models/db-mongo.js
const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing in .env');

  // Use default options for modern mongoose (v6+). You can add e.g. serverSelectionTimeoutMS if you want.
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = { connectMongo, mongoose };
