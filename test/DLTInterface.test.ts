const { connectToNode, subscribeToDOMEEvents, publishDOMEEvent } = require('../src/api/DLTInterface');
const ethers = require('ethers');
import dotenv from "dotenv";
dotenv.config();
import {
  domeEventsContractABI as domeEventsContractABI,
  domeEventsContractAddress as domeEventsContractAddress,
} from "../src/utils/const";

describe('Configure blockchain node', () => {

  it('should configure the session with the provided blockchain node', async () => {
    let session = {iss: "", rpcAddress: ""};
    const iss = '0x43b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c493d';
    const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';
    let req = { session };
    await connectToNode(rpcAddress, iss, req);
    expect(req.session.iss).toBe(iss);
    expect(req.session.rpcAddress).toBe(rpcAddress);
  });
});

jest.mock('ethers');
describe('subscribeToDOMEEvents', () => {
  it('should subscribe to DOME events', () => {
    const eventTypes = ['eventType1', 'eventType2'];
    const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';
    const notificationEndpoint = 'http://marketplace-blockchain-connector-core-digitelts.com/notifications/blockchain-node';

    const simulatedEvent = {
      index: 1,
      timestamp: 1234567890,
      origin: 'originAddress',
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: [],
    };

    const mockProvider = new ethers.providers.JsonRpcProvider(rpcAddress);
    const DOMEEventsContract = new ethers.Contract('0x2BcAb3E30D0EcCd4728b48b80C92ff4E9430B3EE', [], mockProvider);

    const onCallback = (index: any, timestamp: any, origin: any, eventType: any, dataLocation: any, metadata: any) => {
      expect(eventTypes).toContain(eventType); // Verifica si el eventType está en la lista de interés
      expect(origin).toBe('originAddress'); // Verifica el origen del evento


      const onSpy = jest.spyOn(DOMEEventsContract, 'EventDOMEv1');
      onSpy.mockImplementation((eventName, callback) => {
        if (eventName === 'EventDOMEv1') {
          onCallback(simulatedEvent.index, simulatedEvent.timestamp, simulatedEvent.origin, simulatedEvent.eventType, simulatedEvent.dataLocation, simulatedEvent.metadata);
        }
      });
      subscribeToDOMEEvents(eventTypes, rpcAddress, notificationEndpoint);

      expect(onSpy).toHaveBeenCalledWith('EventDOMEv1');

      onSpy.mockRestore();
    }
  });
  it('publishes a DOME event to the blockchain', async () => {
    const eventType = 'eventType1';
    const dataLocation = 'testDataLocation';
    const relevantMetadata = ['metadata1', 'metadata2'];
    const userEthereumAddress = '0xb794f5ea0ba39494ce839613fffba74279579268';
    const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';

    const mockProvider = new ethers.providers.JsonRpcProvider(rpcAddress);
    const mockWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, mockProvider);
    const mockContract = new ethers.Contract(domeEventsContractAddress, domeEventsContractABI, mockWallet);

    ethers.Wallet.mockImplementation(() => mockWallet);
    ethers.Contract.mockImplementation(() => mockContract);
    await publishDOMEEvent(eventType, dataLocation, relevantMetadata, userEthereumAddress, rpcAddress);

    expect(ethers.providers.JsonRpcProvider).toHaveBeenCalledWith(rpcAddress);
    expect(ethers.Wallet).toHaveBeenCalledWith(expect.any(String), mockProvider);
    expect(ethers.Contract).toHaveBeenCalledWith(domeEventsContractAddress, domeEventsContractABI, mockWallet);
  });
});
