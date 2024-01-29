const { connectToNode, subscribeToDOMEEvents, publishDOMEEvent } = require('../src/api/DLTInterface');
const ethers = require('ethers');
import dotenv from "dotenv";
dotenv.config();
import {describe, expect, it} from '@jest/globals'
import { createHash, randomBytes } from "crypto";
import { Set } from "typescript";
import { sleep } from "../src/utils/funcs";
import { IllegalArgumentError } from "../src/exceptions/IllegalArgumentError";
import { getActiveDOMEEventsByDate } from "../src/api/DLTInterface";
import { DOMEEvent } from "../src/utils/types";

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
  }, 10000);

  it('invalid case: blank rpcAddress', async () => {
    let session = {iss: "", rpcAddress: ""};
    let req = { session };
    await expect(connectToNode("", iss, req)).rejects.toThrow(IllegalArgumentError);
  });

  it('invalid case: undefined rpcAddress', async () => {
    let session = {iss: "", rpcAddress: ""};
    let req = { session };
    await expect(connectToNode(undefined, iss, req)).rejects.toThrow(IllegalArgumentError);
  });

  it('invalid case: null rpcAddress', async () => {
    let session = {iss: "", rpcAddress: ""};
    let req = { session };
    await expect(connectToNode(null, iss, req)).rejects.toThrow(IllegalArgumentError);
  });

  it('invalid case: blank iss', async () => {
    let session = {iss: "", rpcAddress: ""};
    let req = { session };
    await expect(connectToNode(rpcAddress, "", req)).rejects.toThrow(IllegalArgumentError);
  });

  it('invalid case: undefined iss', async () => {
    let session = {iss: "", rpcAddress: ""};
    let req = { session };
    await expect(connectToNode(rpcAddress, undefined, req)).rejects.toThrow(IllegalArgumentError);
  });

  it('invalid case: null iss', async () => {
    let session = {iss: "", rpcAddress: ""};
    let req = { session };
    await expect(connectToNode(rpcAddress, null, req)).rejects.toThrow(IllegalArgumentError);
  });
});

describe('DOME events subscription', () => {
  let eventTypesOfInterest: string[];

  beforeAll(() => {
    eventTypesOfInterest = ['eventType1', 'eventType2'];
  });

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
    await sleep(20000);

    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeOne.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeTwo.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).not.toContain(ownIssAsOriginEvent.entityIDHash);
  }, 60000);


  it('invalid case: no event types selected', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents([], rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: blank event types selected', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(["a", "", "u"], rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined event types', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(undefined, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: null event types', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(null, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined rpcAddress', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, undefined, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: null rpcAddress', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, null, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: blank ownIss', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, "", notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined ownIss', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, undefined, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: null ownIss', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, null, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

});

describe('DOME events publication', () => {
  let eventTypesOfInterest: string[];

  beforeAll(() => {
    eventTypesOfInterest = ['eventType1', 'eventType2'];
  })

  const entityIdOne = randomBytes(20).toString('hex');
  const correctEventTypeOne = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: [],
  };

  it('valid case: publishes a DOME event to the blockchain', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');
    
    let entityIDHashesOfReceivedEvents = new Set<string>();
    subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventPublicationValidCaseDOMEEventsHandler(event, entityIDHashesOfReceivedEvents)});
    await publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeOne.entityIDHash);
  }, 60000);

  
  it('invalid case: blank eventType', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent("", correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined eventType', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(undefined, correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null eventType', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(null, correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);
});

describe('DOME active events retrieval', () => {
  let entityIdOne; 
  let entityIdTwo;
  let previousStateEvent: any;
  let activeStateEvent: any;
  let anotherEvent: any;

  let eventTypesOfInterest: string[];
  beforeAll(() => {
    eventTypesOfInterest = ['eventType1', 'eventType2', 'eventType3'];
  })

  beforeEach(() => {
    entityIdOne = randomBytes(20).toString('hex');
    previousStateEvent = {
        origin: iss,
        entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
        previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
        eventType: 'eventType1',
        dataLocation: 'dataLocation1',
        metadata: [],
    };

    activeStateEvent= {
        origin: iss,
        entityIDHash: previousStateEvent.entityIDHash,
        previousEntityHash: previousStateEvent.previousEntityHash,
        eventType: 'eventType2',
        dataLocation: previousStateEvent.dataLocation,
        metadata: previousStateEvent.metadata 
    };
  });

  it('valid case: retrieved events are constrained for the given timeframe and are active events', async () => {
    let initialTime = new Date();
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    let eventPublicationTimestampSeconds = await publishDOMEEvent(activeStateEvent.eventType, activeStateEvent.dataLocation, activeStateEvent.metadata, iss, activeStateEvent.entityIDHash, activeStateEvent.previousEntityHash, rpcAddress);
    let finTime = new Date(eventPublicationTimestampSeconds * 1000);
    await publishDOMEEvent("eventType3", previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);

    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate(initialTime.valueOf(), finTime.valueOf(), rpcAddress);
    let allActiveEventsBetweenDatesEntityIdHashes: string[] = [];
    let allActiveEventsBetweenDatesWithDefinedEntityIdHash: DOMEEvent[] = [];
    allActiveEventsBetweenDates.forEach(event => {
      allActiveEventsBetweenDatesEntityIdHashes.push(event.entityId);

      if(event.entityId === previousStateEvent.entityIDHash){
        allActiveEventsBetweenDatesWithDefinedEntityIdHash.push(event);
      }
    });

    expect(allActiveEventsBetweenDatesEntityIdHashes).toContain(previousStateEvent.entityIDHash);
    expect(allActiveEventsBetweenDatesWithDefinedEntityIdHash.length).toBe(1);
    expect(allActiveEventsBetweenDatesWithDefinedEntityIdHash[0].eventType).toBe(activeStateEvent.eventType);
  }, 600000);

  it('valid case: active event in lower boundary IS included', async () => {
    let timestampOfPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate(timestampOfPublishedEvent! * 1000, timestampOfPublishedEvent! * 1000, rpcAddress);
    let allActiveEventsBetweenDatesEntityIdHashes: string[] = [];
    let allActiveEventsBetweenDatesWithDefinedEntityIdHash: DOMEEvent[] = [];
    allActiveEventsBetweenDates.forEach(event => {
      allActiveEventsBetweenDatesEntityIdHashes.push(event.entityId);

      if(event.entityId === previousStateEvent.entityIDHash){
        allActiveEventsBetweenDatesWithDefinedEntityIdHash.push(event);
      }
    });
    expect(allActiveEventsBetweenDatesWithDefinedEntityIdHash.length).toBe(1);
  }, 60000);

  it('valid case: active event in upper boundary IS included', async () => {
    let initialTime = new Date();
    let timestampOfPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate(timestampOfPublishedEvent * 1000, timestampOfPublishedEvent * 1000, rpcAddress);
    let allActiveEventsBetweenDatesEntityIdHashes: string[] = [];
    let allActiveEventsBetweenDatesWithDefinedEntityIdHash: DOMEEvent[] = [];
    allActiveEventsBetweenDates.forEach(event => {
      allActiveEventsBetweenDatesEntityIdHashes.push(event.entityId);

      if(event.entityId === previousStateEvent.entityIDHash){
        allActiveEventsBetweenDatesWithDefinedEntityIdHash.push(event);
      }
    });
    expect(allActiveEventsBetweenDatesWithDefinedEntityIdHash.length).toBe(1);
  }, 60000);

  it('valid case: active event out of lower boundary IS NOT included', async () => {
    let timestampOfPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate((timestampOfPublishedEvent + 1) * 1000, (timestampOfPublishedEvent + 1) * 1000, rpcAddress);
    let allActiveEventsBetweenDatesEntityIdHashes: string[] = [];
    let allActiveEventsBetweenDatesWithDefinedEntityIdHash: DOMEEvent[] = [];
    allActiveEventsBetweenDates.forEach(event => {
      allActiveEventsBetweenDatesEntityIdHashes.push(event.entityId);

      if(event.entityId === previousStateEvent.entityIDHash){
        allActiveEventsBetweenDatesWithDefinedEntityIdHash.push(event);
      }
    });
    expect(allActiveEventsBetweenDatesWithDefinedEntityIdHash.length).toBe(0);
  }, 60000);

  it('valid case: active event out of upper boundary IS NOT included', async () => {
    let initialTime = new Date();
    let timestampOfPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate((timestampOfPublishedEvent - 1) * 1000, (timestampOfPublishedEvent - 1) * 1000, rpcAddress);
    let allActiveEventsBetweenDatesEntityIdHashes: string[] = [];
    let allActiveEventsBetweenDatesWithDefinedEntityIdHash: DOMEEvent[] = [];
    allActiveEventsBetweenDates.forEach(event => {
      allActiveEventsBetweenDatesEntityIdHashes.push(event.entityId);

      if(event.entityId === previousStateEvent.entityIDHash){
        allActiveEventsBetweenDatesWithDefinedEntityIdHash.push(event);
      }
    });
    expect(allActiveEventsBetweenDatesWithDefinedEntityIdHash.length).toBe(0);
  }, 60000);

  it('invalid case: start date is later than the end date', async () => {
    let initialTime = new Date();
    let finTime = new Date();
    finTime.setFullYear(initialTime.getFullYear() + 1);

    await expect(getActiveDOMEEventsByDate(finTime.valueOf(), initialTime.valueOf(), rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 60000);
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