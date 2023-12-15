import mongoose from 'mongoose';

export enum LogType {
    DEBUG = "DEBUG",
    ERROR = "ERROR",
}

const loggerCollectionSchema = new mongoose.Schema({
    timeStamp: String,
    id: String,
    logType: String,
    logMessage: String
});

const Logger = mongoose.model('logs', loggerCollectionSchema);

export async function saveLogDB(identifier: string, logType: LogType, logMessage: string) {
    if (process.env.DEBUG === "*") {
        const now = new Date().toISOString();
        const dataLog = {
            timeStamp: now,
            id: identifier,
            logType: logType,
            logMessage: logMessage,
        }
        const newLog = new Logger(dataLog);
        newLog.save();
    }
}