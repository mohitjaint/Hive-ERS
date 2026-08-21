import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns';

dotenv.config();

// Fallback to Google & Cloudflare DNS to avoid local ISP/DNS SRV query failures (ESERVFAIL)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore error if system restricts setting custom DNS
}

const connectDB = async ()=> {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export default connectDB;
