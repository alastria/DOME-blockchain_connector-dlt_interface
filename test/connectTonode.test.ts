const { connectToNode, subscribeToDOMEEvents } = require('../src/api/DLTInterface');
const ethers = require('ethers');
import {
    domeEventsContractABI as domeEventsContractABI,
    domeEventsContractAddress as domeEventsContractAddress,
} from "../src/utils/const";

describe('Configure Bblockchain node', () => {
    it('should configure the session with the provided blockchain node', async () => {
        // Create a mock session object
        const session = {
            provider: ' {"_isProvider":true,"_events":[],"_emitted":{"block":-2},"disableCcipRead":false,"formatter":{"formats":{"transaction":{},"transactionRequest":{},"receiptLog":{},"receipt":{},"block":{},"blockWithTransactions":{},"filter":{},"filterLog":{}}},"anyNetwork":false,"_networkPromise":{},"_maxInternalBlockNumber":-1024,"_lastBlockNumber":-2,"_maxFilterBlockRange":10,"_pollingInterval":4000,"_fastQueryDate":0,"connection":{"url":"https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6"},"_nextId":42}',
            userEthereumAddress: '0xb794f5ea0ba39494ce839613fffba74279579268',
            rpcAddress: 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6',
        };

        const userEthereumAddress = '0xb794f5ea0ba39494ce839613fffba74279579268';
        const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';

        // Create a mock req object with the session
        const req = { session };

        await connectToNode(rpcAddress, userEthereumAddress, req);

        // Verify that session properties are set correctly
        expect(session.provider).toBeInstanceOf(ethers.providers.JsonRpcProvider);
        expect(session.userEthereumAddress).toBe(userEthereumAddress);
        expect(session.rpcAddress).toBe(rpcAddress);
    });
});
// const axios = require('axios');

// jest.mock('axios');
// describe('Suscribe to single event method', () => {
//     it('should subscribe to DOME events and send notifications for the specified event types', () => {
//         // Define mock values
//         const eventTypes = ['EventA'];
//         const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';
//         const notificationEndpoint = 'http://localhost:8080/api/v1/testSubscribedUser';
    
//         // Mock axios post method to simulate a successful notification
//         axios.post.mockResolvedValue({ status: 200 });
    

    
//         // Call the function with mock values
//         subscribeToDOMEEvents(eventTypes, rpcAddress, notificationEndpoint);
        
//         const provider = new ethers.providers.JsonRpcProvider(rpcAddress);

//         //TODO: Secure PrivateKey
//         const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
     
    
//         const domeEventsContractWithSigner = new ethers.Contract(
//             domeEventsContractAddress,
//             domeEventsContractABI,
//             wallet
//         );

//         // Simulate a DOME event emission (you may need to adjust this based on your contract)
//         const DOMEEventsContract = new ethers.Contract(domeEventsContractAddress,domeEventsContractABI , domeEventsContractWithSigner.wallet);
//         DOMEEventsContract.emit("EventDOMEv1", 1, 1234567890, 'origin', 'EventA', 'dataLocation', 'metadata');
    
//         // Verify that axios.post was called with the expected parameters
//         expect(axios.post).toHaveBeenCalledWith(
//           notificationEndpoint,
//           expect.any(String), // JSON string
//           { headers: { 'Content-Type': 'application/json' } }
//         );
//       });
// });