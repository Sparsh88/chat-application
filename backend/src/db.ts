import mongoose from 'mongoose';

// Connection options optimized for high throughput, connection pooling and fast cold starts
const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  bufferCommands: false,
};

let cachedPromise: Promise<typeof mongoose> | null = null;
let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️ MONGODB_URI environment variable not set. Running in fallback in-memory mode.');
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (cachedPromise) {
    try {
      await cachedPromise;
      isConnected = mongoose.connection.readyState === 1;
      return isConnected;
    } catch {
      cachedPromise = null;
    }
  }

  try {
    cachedPromise = mongoose.connect(mongoURI, MONGOOSE_OPTIONS);
    await cachedPromise;
    isConnected = true;
    console.log('🌱 Connected to MongoDB successfully with connection pooling!');

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected.');
      isConnected = false;
      cachedPromise = null;
    });

    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    cachedPromise = null;
    isConnected = false;
    return false;
  }
};

export const getIsConnected = () => isConnected && mongoose.connection.readyState === 1;

