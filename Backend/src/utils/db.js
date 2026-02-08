const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async (retries = 5) => {
    if (isConnected) {
        console.log('Using existing MongoDB connection');
        return;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sensor_data';

    let attempts = 0;

    while (attempts < retries) {
        try {
            attempts++;
            console.log(`Attempting to connect to MongoDB (attempt ${attempts}/${retries})...`);

            await mongoose.connect(mongoURI, {
                maxPoolSize: 10,
                minPoolSize: 2,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 5000,
            });

            isConnected = true;
            console.log('✅ MongoDB connected successfully');

            mongoose.connection.on('error', (err) => {
                console.error('MongoDB connection error:', err);
                isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('MongoDB disconnected');
                isConnected = false;
            });

            return;

        } catch (error) {
            console.error(`MongoDB connection attempt ${attempts} failed:`, error.message);

            if (attempts >= retries) {
                console.error('❌ Failed to connect to MongoDB after multiple attempts');
                throw error;
            }

            const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

const disconnectDB = async () => {
    if (!isConnected) {
        return;
    }

    try {
        await mongoose.connection.close();
        isConnected = false;
        console.log('MongoDB disconnected gracefully');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
};

module.exports = {
    connectDB,
    disconnectDB,
    getConnectionStatus: () => isConnected
};
