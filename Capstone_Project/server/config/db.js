const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shortlink_db';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    console.log('[Database Tip] Check if MongoDB is running locally, or update MONGO_URI in server/.env with your MongoDB Atlas cluster URI.');
  }
};

module.exports = connectDB;
