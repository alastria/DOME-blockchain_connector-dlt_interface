import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
    iss: String,
    rpcAddress: String
});

const Sessions = mongoose.model('sessions', collectionSchema);

export function saveSession(data: any) {
    const newUserSession = new Sessions(data);
    newUserSession.save()
        .then(() => {
            console.log('Session saved successfully');
        })
        .catch((err) => {
            console.error('Error saving session:', err);
        });
};

export async function getSessionByISS(iss: string, req: any) {
    console.log(" > Getting user session..");
    try {
        let session = await Sessions.find({ iss: iss }).limit(1);
        if (session === undefined || session.length === 0) {
            return 0;
        } else {
            req.session.iss = session[0].iss;
            req.session.rpcAddress = session[0].rpcAddress;
            return 1;
        }
    } catch (error) {
        console.error('Error retrieving data:', error);
    }
};