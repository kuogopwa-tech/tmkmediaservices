const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectMongo() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment/.env');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  isConnected = true;
  console.log('✅ Connected to MongoDB');
}

module.exports = {
  connectMongo,
  mongoose,
};

