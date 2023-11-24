import mongoose from 'mongoose';
import { mongoURI as mongoURI } from "../utils/const";

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(mongoURI);
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
};


export const closeDatabaseConnection = async () => {
    try {
        await mongoose.disconnect();
        console.log('Close MongoDB connection');
    } catch (error) {
        console.error('Error disconnecting to MongoDB', error);
    }
}