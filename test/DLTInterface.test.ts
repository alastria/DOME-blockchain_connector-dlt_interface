const { connectToNode, subscribeToDOMEEvents, publishDOMEEvent } = require('../src/api/DLTInterface');
const ethers = require('ethers');
import dotenv from "dotenv";
dotenv.config();
import {
  domeEventsContractABI,
  domeEventsContractAddress
} from "../src/utils/const";
import {describe, expect, it} from '@jest/globals'
import { createHash } from "crypto";
import { randomBytes } from "crypto";
import { NotificationEndpointError } from "../src/exceptions/NotificationEndpointError";
import { Set } from "typescript";

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

describe('DOME events subscription', () => {

  it('valid case: should subscribe to DOME events', async () => {
    const eventTypesOfInterest = ['eventType1', 'eventType2'];
    const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';
    const notificationEndpoint = 'http://marketplace-blockchain-connector-core-digitelts.com/notifications/blockchain-node';
    const ownIss = "0x61b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c351e"
    const iss = "0x43b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c493d";
    const entityIdOne = randomBytes(20).toString('hex');
    const entityIdTwo= randomBytes(20).toString('hex');
    const entityIdThree = randomBytes(20).toString('hex');


    const correctEventTypeOne = {
      origin: iss,
      entityIDHash: createHash('sha256').update(entityIdOne).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: [],
    };
    
    const correctEventTypeTwo = {
      origin: iss,
      entityIDHash: createHash('sha256').update(entityIdTwo).digest('hex'),
      previousEntityHash: "0x843c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType2',
      dataLocation: correctEventTypeOne.dataLocation,
      metadata: [],
    };

    const ownIssAsOriginEvent = {
      origin: ownIss,
      entityIDHash: createHash('sha256').update(entityIdThree).digest('hex'),
      previousEntityHash: "0x843c956500000000001000000070000000600000000000300000000050000000",
      eventType: correctEventTypeTwo.eventType,
      dataLocation: correctEventTypeOne.dataLocation,
      metadata: [],
    };

    await publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, rpcAddress);
    await publishDOMEEvent(correctEventTypeTwo.eventType, correctEventTypeTwo.dataLocation, correctEventTypeTwo.metadata, iss, rpcAddress);
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, notificationEndpoint, (event: any) => {validCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrow(NotificationEndpointError);

    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeOne.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeTwo.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).not.toContain(ownIssAsOriginEvent.entityIDHash);
  });

  it('valid case: publishes a DOME event to the blockchain', async () => {
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


/**
 * Event handler for DOME events that tests that the events received are to be received.
 *
 * @param event the DOME event to be handled.
 * @param eventTypesOfInterest the DOME event types to be received.
 * @param ownIss the identifier of the entity expected to be processing the events.
 * @param entityIDHashesOfReceivedEvents the entityIDHashes of the events already handled by this handler.
 */
function validCaseDOMEEventsHandler(event: any, eventTypesOfInterest: string[], ownIss: string, entityIDHashesOfReceivedEvents: Set<string>){
  entityIDHashesOfReceivedEvents.add(event.entityIDHash);
  expect(event.iss).not.toBe(ownIss);
  expect(eventTypesOfInterest).toContain(event.eventType);
}