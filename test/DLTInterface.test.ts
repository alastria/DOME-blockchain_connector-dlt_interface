const { connectToNode, subscribeToDOMEEvents, publishDOMEEvent } = require('../src/api/DLTInterface');
const ethers = require('ethers');
import dotenv from "dotenv";
dotenv.config();
import {describe, expect, it} from '@jest/globals'
import { createHash, randomBytes } from "crypto";
import { Set } from "typescript";
import { sleep } from "../src/utils/funcs";

const eventTypesOfInterest = ['eventType1', 'eventType2'];
const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';
const notificationEndpoint = undefined;
const ownIss = "0x61b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c351e"
const iss = "0x43b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c493d";

describe('Configure blockchain node', () => {

  it('valid case: should configure the session with the provided blockchain node', async () => {
    let session = {iss: "", rpcAddress: ""};
    let req = { session };
    await connectToNode(rpcAddress, iss, req);
    expect(req.session.iss).toBe(iss);
    expect(req.session.rpcAddress).toBe(rpcAddress);
  });
});

describe('DOME events subscription', () => {

  it('valid case: should subscribe to DOME events', async () => {

    const entityIdOne = randomBytes(20).toString('hex');
    const entityIdTwo= randomBytes(20).toString('hex');
    const entityIdThree = randomBytes(20).toString('hex');


    const correctEventTypeOne = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: [],
    };
    
    const correctEventTypeTwo = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdTwo).digest('hex'),
      previousEntityHash: "0x843c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType2',
      dataLocation: correctEventTypeOne.dataLocation,
      metadata: [],
    };

    const ownIssAsOriginEvent = {
      origin: ownIss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdThree).digest('hex'),
      previousEntityHash: "0x843c956500000000001000000070000000600000000000300000000050000000",
      eventType: correctEventTypeTwo.eventType,
      dataLocation: correctEventTypeOne.dataLocation,
      metadata: [],
    };

    let entityIDHashesOfReceivedEvents = new Set<string>();
    subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)});
    await publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress);
    await publishDOMEEvent(correctEventTypeTwo.eventType, correctEventTypeTwo.dataLocation, correctEventTypeTwo.metadata, iss, correctEventTypeTwo.entityIDHash, correctEventTypeTwo.previousEntityHash, rpcAddress);
    await sleep(4000);

    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeOne.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeTwo.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).not.toContain(ownIssAsOriginEvent.entityIDHash);
  }, 30000);

  
});

describe('DOME events publication', () => {

  it('valid case: publishes a DOME event to the blockchain', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    const correctEventTypeOne = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: [],
    };

    let entityIDHashesOfReceivedEvents = new Set<string>();
    subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventPublicationValidCaseDOMEEventsHandler(event, entityIDHashesOfReceivedEvents)});
    await publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress);
    await sleep(4000);

    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeOne.entityIDHash);
  }, 30000);
});



/**
 * Event handler for DOME events that tests that the events received are to be received.
 *
 * @param event the DOME event to be handled.
 * @param eventTypesOfInterest the DOME event types to be received.
 * @param ownIss the identifier of the entity expected to be processing the events.
 * @param entityIDHashesOfReceivedEvents the entityIDHashes of the events already handled by this handler.
 */
function eventSubscriptionValidCaseDOMEEventsHandler(event: any, eventTypesOfInterest: string[], ownIss: string, entityIDHashesOfReceivedEvents: Set<string>){
  entityIDHashesOfReceivedEvents.add(event.entityIDHash);
  expect(event.iss).not.toBe(ownIss);
  expect(eventTypesOfInterest).toContain(event.eventType);
}

/**
 * Event handler for DOME events that tests that the events received are to be received.
 *
 * @param event the DOME event to be handled.
 * @param entityIDHashesOfReceivedEvents the entityIDHashes of the events already handled by this handler.
 */
function eventPublicationValidCaseDOMEEventsHandler(event: any, entityIDHashesOfReceivedEvents: Set<string>){
  entityIDHashesOfReceivedEvents.add(event.entityIDHash);
}