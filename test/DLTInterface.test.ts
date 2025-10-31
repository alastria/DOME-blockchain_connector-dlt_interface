const { connectToNode, subscribeToDOMEEvents, publishDOMEEvent, subscribeToAllDOMEEvents } = require('../src/api/DLTInterface');
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

const rpcAddress = process.env.RPC_ADDRESS;
const notificationEndpoint = undefined;
const ownIss = "0x61b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c351e"
const iss = process.env.ISS;

describe('DOME events subscription', () => {
  let eventTypesOfInterest: string[];
  let entityIdOne: string;
  let entityIdTwo: string;
  let entityIdThree: string; 

  let correctEventTypeOne: any;
  let correctEventTypeTwo: any;
  let ownIssAsOriginEvent: any;

  let metadata: string[];

  beforeAll(() => {
    eventTypesOfInterest = ['eventType1', 'eventType2'];
    metadata = ['sbx'];
  });

  beforeEach(() => {
    entityIdOne = randomBytes(20).toString('hex');
    entityIdTwo= randomBytes(20).toString('hex');
    entityIdThree = randomBytes(20).toString('hex');

    correctEventTypeOne = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: metadata,
    };

    correctEventTypeTwo = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdTwo).digest('hex'),
      previousEntityHash: "0x843c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType2',
      dataLocation: correctEventTypeOne.dataLocation,
      metadata: metadata,
    };

    ownIssAsOriginEvent = {
      origin: ownIss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdThree).digest('hex'),
      previousEntityHash: correctEventTypeTwo.previousEntityHash,
      eventType: correctEventTypeTwo.eventType,
      dataLocation: correctEventTypeOne.dataLocation,
      metadata: metadata,
    };
  });

  it('valid case: should subscribe to DOME events', async () => {

    let entityIDHashesOfReceivedEvents = new Set<string>();
    subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)});
    await publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.dataLocation, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress);
    await publishDOMEEvent(correctEventTypeTwo.eventType, correctEventTypeTwo.dataLocation, correctEventTypeTwo.metadata, iss, correctEventTypeTwo.entityIDHash, correctEventTypeTwo.previousEntityHash, rpcAddress);
    await publishDOMEEvent(correctEventTypeTwo.eventType, correctEventTypeTwo.dataLocation, correctEventTypeTwo.metadata, ownIssAsOriginEvent.origin, ownIssAsOriginEvent.entityIDHash, correctEventTypeTwo.previousEntityHash, rpcAddress);
    await sleep(10000);

    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeOne.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).toContain(correctEventTypeTwo.entityIDHash);
    expect(entityIDHashesOfReceivedEvents).not.toContain(ownIssAsOriginEvent.entityIDHash);
  }, 80000);

  it('invalid case: no event types selected', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents([], metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: blank event types selected', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(["a", "", "u"], metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined event types', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(undefined, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: null event types', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(null, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined rpcAddress', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, metadata, undefined, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: null rpcAddress', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, metadata, null, ownIss, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: blank ownIss', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, "", notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined ownIss', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, undefined, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

  it('invalid case: null ownIss', async () => {
    let entityIDHashesOfReceivedEvents = new Set<string>();
    expect(() => subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, null, notificationEndpoint, (event: any) => {eventSubscriptionValidCaseDOMEEventsHandler(event, eventTypesOfInterest, ownIss, entityIDHashesOfReceivedEvents)})).toThrowError(IllegalArgumentError);
  }, 30000);

});

describe('DOME events publication', () => {
  let eventTypesOfInterest: string[];
  let entityIdOne;
  let correctEventTypeOne: any;

  let metadata: string[];

  beforeAll(() => {
    eventTypesOfInterest = ['eventType1', 'eventType2'];
    metadata = ['sbx'];
  })

  beforeEach(() => {
    entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: metadata,
    };
  });

  it('valid case: publishes a DOME event to the blockchain', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');
    
    let entityIDHashesOfReceivedEvents = new Set<string>();
    subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {eventPublicationValidCaseDOMEEventsHandler(event, entityIDHashesOfReceivedEvents)});
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

  it('invalid case: blank datalocation', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, "", correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined datalocation', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, undefined, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null datalocation', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, null, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);


  it('invalid case: blank iss', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, "", correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  
  it('invalid case: undefined iss', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, undefined, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null iss', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, null, correctEventTypeOne.entityIDHash, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: blank entityIdHash', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, "", correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined entityIdHash', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, undefined, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null entityIdHash', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, null, correctEventTypeOne.previousEntityHash, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined previousEntityHash', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIdHash, undefined, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null previousEntityHash', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIdHash, null, rpcAddress)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: blank rpcAddress', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIdHash, "", "")).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined rpcAddress', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIdHash, "", undefined)).rejects.toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null rpcAddress', async () => {
    const entityIdOne = randomBytes(20).toString('hex');
    correctEventTypeOne.entityIDHash = "0x" + createHash('sha256').update(entityIdOne).digest('hex');

    await expect(publishDOMEEvent(correctEventTypeOne.eventType, correctEventTypeOne.iss, correctEventTypeOne.metadata, iss, correctEventTypeOne.entityIdHash, "", null)).rejects.toThrow(IllegalArgumentError);
  }, 30000);


});

describe('DOME active events retrieval', () => {
  let entityIdOne: any; 
  let previousStateEvent: any;
  let activeStateEvent: any;
  let metadata: string[];

  let eventTypesOfInterest: string[];
  beforeAll(() => {
    eventTypesOfInterest = ['eventType1', 'eventType2', 'eventType3'];
    metadata = ['sbx'];
  })

  beforeEach(() => {
    entityIdOne = randomBytes(20).toString('hex');
    previousStateEvent = {
        origin: iss,
        entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
        previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
        eventType: 'eventType1',
        dataLocation: 'dataLocation1',
        metadata: metadata 
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

    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate(initialTime.valueOf(), finTime.valueOf(), metadata[0], rpcAddress!);
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
    subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate(timestampOfPublishedEvent * 1000, timestampOfPublishedEvent * 1000, metadata[0], rpcAddress!);
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
    let timestampOfPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate(timestampOfPublishedEvent * 1000, timestampOfPublishedEvent * 1000, metadata[0], rpcAddress!);
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

  it('valid case: Event of other env than the one of interest is not notified', async () => {
    let entityId = randomBytes(20).toString('hex');
    let eventOfAnotherEnv = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityId).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: ["dev"],
    };

    let timestampOfFirstPublishedEvent: number = -1; 
    let timestampOfLatestPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, metadata, previousStateEvent.metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {

    });
    let initialTime = new Date();
    timestampOfFirstPublishedEvent = await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    timestampOfLatestPublishedEvent = await publishDOMEEvent(eventOfAnotherEnv.eventType, eventOfAnotherEnv.dataLocation, eventOfAnotherEnv.metadata, iss, eventOfAnotherEnv.entityIDHash, eventOfAnotherEnv.previousEntityHash, rpcAddress);
    let finTime = new Date();
    await sleep(20000);

    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate(initialTime.valueOf(), finTime.valueOf(), metadata[0], rpcAddress!);
    let allActiveEventsBetweenDatesEntityIdHashes: string[] = [];
    let allActiveEventsBetweenDatesWithDefinedEntityIdHash: DOMEEvent[] = [];
    allActiveEventsBetweenDates.forEach(event => {
      allActiveEventsBetweenDatesEntityIdHashes.push(event.entityId);

      if(event.entityId === previousStateEvent.entityIDHash || event.entityId === eventOfAnotherEnv.entityIDHash){
        allActiveEventsBetweenDatesWithDefinedEntityIdHash.push(event);
      }
    });
    expect(allActiveEventsBetweenDatesWithDefinedEntityIdHash.length).toBe(1);
  }, 60000);

  it('valid case: active event out of lower boundary IS NOT included', async () => {
    let timestampOfPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate((timestampOfPublishedEvent + 1) * 1000, (timestampOfPublishedEvent + 1) * 1000, metadata[0], rpcAddress!);
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
    let timestampOfPublishedEvent: number = -1; 
    subscribeToDOMEEvents(eventTypesOfInterest, metadata, rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      if(event.entityIDHash === previousStateEvent.entityIDHash){
        timestampOfPublishedEvent = event.timestamp;
      }
    });
    await publishDOMEEvent(previousStateEvent.eventType, previousStateEvent.dataLocation, previousStateEvent.metadata, iss, previousStateEvent.entityIDHash, previousStateEvent.previousEntityHash, rpcAddress);
    await sleep(20000);

    expect(timestampOfPublishedEvent).not.toBe(-1);
    let allActiveEventsBetweenDates = await getActiveDOMEEventsByDate((timestampOfPublishedEvent - 1) * 1000, (timestampOfPublishedEvent - 1) * 1000, metadata[0], rpcAddress!);
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

    await expect(getActiveDOMEEventsByDate(finTime.valueOf(), initialTime.valueOf(), metadata[0], rpcAddress!)).rejects.toThrow(IllegalArgumentError);
  }, 60000);

  it('invalid case: rpcAddress is blank', async () => {
    let initialTime = new Date();
    let finTime = new Date();
    finTime.setFullYear(initialTime.getFullYear() + 1);

    await expect(getActiveDOMEEventsByDate(initialTime.valueOf(), finTime.valueOf(), metadata[0], "")).rejects.toThrow(IllegalArgumentError);
  }, 60000);

});

describe('DOME all events subscription', () => {
  let entityIdOne: string;
  let entityIdTwo: string;
  let entityIdThree: string;
  let entityIdFour: string;
  let entityIdFive: string;

  let eventTypeOne: any;
  let eventTypeTwo: any;
  let eventTypeThree: any;
  let eventTypeFour: any;
  let eventTypeFive: any;

  let metadata: string[];
  let metadata2: string[];

  beforeAll(() => {
    metadata = ['sbx'];
    metadata2 = ['prd'];
  });

  beforeEach(() => {
    entityIdOne = randomBytes(20).toString('hex');
    entityIdTwo = randomBytes(20).toString('hex');
    entityIdThree = randomBytes(20).toString('hex');
    entityIdFour = randomBytes(20).toString('hex');
    entityIdFive = randomBytes(20).toString('hex');

    eventTypeOne = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdOne).digest('hex'),
      previousEntityHash: "0x743c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: metadata,
    };

    eventTypeTwo = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdTwo).digest('hex'),
      previousEntityHash: "0x843c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType2',
      dataLocation: 'dataLocation2',
      metadata: metadata2,
    };

    eventTypeThree = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdThree).digest('hex'),
      previousEntityHash: "0x943c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType3',
      dataLocation: 'dataLocation3',
      metadata: metadata,
    };

    eventTypeFour = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdFour).digest('hex'),
      previousEntityHash: "0xa43c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType4',
      dataLocation: 'dataLocation4',
      metadata: metadata,
    };

    eventTypeFive = {
      origin: iss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdFive).digest('hex'),
      previousEntityHash: "0xb43c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType5',
      dataLocation: 'dataLocation5',
      metadata: metadata,
    };
  });

  it('valid case: should receive all event types regardless of eventType', async () => {
    let receivedEvents = new Set<string>();
    let receivedEventTypes = new Set<string>();
    
    subscribeToAllDOMEEvents(rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      receivedEvents.add(event.entityIDHash);
    });

    await publishDOMEEvent(eventTypeOne.eventType, eventTypeOne.dataLocation, eventTypeOne.metadata, iss, eventTypeOne.entityIDHash, eventTypeOne.previousEntityHash, rpcAddress);
    await publishDOMEEvent(eventTypeTwo.eventType, eventTypeTwo.dataLocation, eventTypeTwo.metadata, iss, eventTypeTwo.entityIDHash, eventTypeTwo.previousEntityHash, rpcAddress);
    await publishDOMEEvent(eventTypeThree.eventType, eventTypeThree.dataLocation, eventTypeThree.metadata, iss, eventTypeThree.entityIDHash, eventTypeThree.previousEntityHash, rpcAddress);
    await publishDOMEEvent(eventTypeFour.eventType, eventTypeFour.dataLocation, eventTypeFour.metadata, iss, eventTypeFour.entityIDHash, eventTypeFour.previousEntityHash, rpcAddress);
    await publishDOMEEvent(eventTypeFive.eventType, eventTypeFive.dataLocation, eventTypeFive.metadata, iss, eventTypeFive.entityIDHash, eventTypeFive.previousEntityHash, rpcAddress);
    
    await sleep(15000);

    expect(receivedEvents).toContain(eventTypeOne.entityIDHash);
    expect(receivedEvents).toContain(eventTypeTwo.entityIDHash);
    expect(receivedEvents).toContain(eventTypeThree.entityIDHash);
    expect(receivedEvents).toContain(eventTypeFour.entityIDHash);
    expect(receivedEvents).toContain(eventTypeFive.entityIDHash);

    expect(receivedEvents).toContain(eventTypeOne.entityIDHash);
    expect(receivedEvents).toContain(eventTypeTwo.entityIDHash);
    expect(receivedEvents).toContain(eventTypeThree.entityIDHash);
    expect(receivedEvents).toContain(eventTypeFour.entityIDHash);
    expect(receivedEvents).toContain(eventTypeFive.entityIDHash);
  }, 80000);

  it('valid case: should not receive events published by ownIss', async () => {
    let entityIdOwnIss = randomBytes(20).toString('hex');
    let ownIssEvent = {
      origin: ownIss,
      entityIDHash: "0x" + createHash('sha256').update(entityIdOwnIss).digest('hex'),
      previousEntityHash: "0xc43c956500000000001000000070000000600000000000300000000050000000",
      eventType: 'eventType1',
      dataLocation: 'dataLocation1',
      metadata: metadata,
    };

    let receivedEvents = new Set<string>();
    
    subscribeToAllDOMEEvents(rpcAddress, ownIss, notificationEndpoint, (event: any) => {
      receivedEvents.add(event.entityIDHash);
    });

    await publishDOMEEvent(eventTypeOne.eventType, eventTypeOne.dataLocation, eventTypeOne.metadata, iss, eventTypeOne.entityIDHash, eventTypeOne.previousEntityHash, rpcAddress);
    await publishDOMEEvent(ownIssEvent.eventType, ownIssEvent.dataLocation, ownIssEvent.metadata, ownIssEvent.origin, ownIssEvent.entityIDHash, ownIssEvent.previousEntityHash, rpcAddress);
    await sleep(15000);

    expect(receivedEvents).toContain(eventTypeOne.entityIDHash);
    expect(receivedEvents).not.toContain(ownIssEvent.entityIDHash);
  }, 80000);

  it('invalid case: blank rpcAddress', async () => {
    expect(() => {
      subscribeToAllDOMEEvents("", ownIss, notificationEndpoint, (event: any) => {});
    }).toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null rpcAddress', async () => {
    expect(() => {
      subscribeToAllDOMEEvents(null, ownIss, notificationEndpoint, (event: any) => {});
    }).toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined rpcAddress', async () => {
    expect(() => {
      subscribeToAllDOMEEvents(undefined, ownIss, notificationEndpoint, (event: any) => {});
    }).toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: blank ownIss', async () => {
    expect(() => {
      subscribeToAllDOMEEvents(rpcAddress, "", notificationEndpoint, (event: any) => {});
    }).toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: null ownIss', async () => {
    expect(() => {
      subscribeToAllDOMEEvents(rpcAddress, null, notificationEndpoint, (event: any) => {});
    }).toThrow(IllegalArgumentError);
  }, 30000);

  it('invalid case: undefined ownIss', async () => {
    expect(() => {
      subscribeToAllDOMEEvents(rpcAddress, undefined, notificationEndpoint, (event: any) => {});
    }).toThrow(IllegalArgumentError);
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
  expect(event.publisherAddress).not.toBe(ownIss);
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