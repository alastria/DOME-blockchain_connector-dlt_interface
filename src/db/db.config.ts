import mongoose from 'mongoose';

const mongoURI = 'mongodb://mongodb:27017/DLTInterface';

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(mongoURI);

    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
};


