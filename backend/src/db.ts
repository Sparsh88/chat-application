import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️ MONGODB_URI environment variable not set. Running in fallback in-memory mode.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log('🌱 Connected to MongoDB successfully!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
};

export const getIsConnected = () => isConnected;
