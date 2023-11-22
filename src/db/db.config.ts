import mongoose from 'mongoose';
import { mongoURI as mongoURI } from "../utils/const";

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(mongoURI);

    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
};


