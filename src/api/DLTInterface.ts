import { debug } from "debug";
import { BigNumber, ethers } from "ethers";
import {
  DOME_EVENTS_CONTRACT_ABI,
  DOME_EVENTS_CONTRACT_ADDRESS,
  DOME_PRODUCTION_BLOCK_NUMBER
} from "../utils/const";
import axios from "axios";

import { IllegalArgumentError } from "../exceptions/IllegalArgumentError";
import { NotificationEndpointError } from "../exceptions/NotificationEndpointError";

const debugLog = debug("DLT Interface Service: ");
const errorLog = debug("DLT Interface Service:error ");

/**
 * Configures a blockchain node as the one to be used for the user's session. The session is managed at cookie level.
 * @param rpcAddress the address of the blockchain node.
 * @param iss the organization identifier hash
 * @param req the HTTP request.
 */
export async function connectToNode(rpcAddress: string, iss: string, req: any) {
  if (rpcAddress === "") {
    throw new IllegalArgumentError("The rpc address is blank.");
  }
  if (rpcAddress === null || rpcAddress === undefined) {
    throw new IllegalArgumentError("The rpc address is null.");
  }
  if (iss === "") {
    throw new IllegalArgumentError("The iss identifier is blank.");
  }
  if (iss === null || iss === undefined) {
    throw new IllegalArgumentError("The iss identifier is null.");
  }

  debugLog(">>> Connecting to blockchain node...");
  // Entry parameters in method.
  debugLog("  > rpcAddress: " + rpcAddress);
  debugLog("  > iss: " + iss);

  let provider;
  try {
    provider = new ethers.providers.JsonRpcProvider(rpcAddress);
  } catch (error) {
    errorLog(" > !! Error connecting to the blockchain");
    throw error;
  }

  debugLog("  > Provider: " + JSON.stringify(provider));
  debugLog(
    "  > Provider Network: " + JSON.stringify(await provider.getNetwork())
  );
  // Registry req parameters in session.
  debugLog("  > req.session: " + JSON.stringify(req.session));
  debugLog("  > req.headers: " + JSON.stringify(req.headers));
  req.session.provider = provider;
  req.session.iss = iss;
  req.session.rpcAddress = rpcAddress;
  debugLog(
    "  > Stored blockchain node configuration for this user's session (provider and public key)."
  );
}

/**
 * Publish DOME event as a blockchain event.
 *
 * @param eventType the name of the dome event
 * @param dataLocation the storage or location of the data associated with the event.
 * @param relevantMetadata additional information or metadata relevant to the event.
 * @param iss the organization identifier hash
 * @param rpcAddress the address of the blockchain node
 * @param entityIDHash entity identifier hash
 */
export async function publishDOMEEvent(
  eventType: string,
  dataLocation: string,
  relevantMetadata: Array<string>,
  iss: string,
  entityIDHash: string,
  previousEntityHash: string,
  rpcAddress: string
) {
  if (eventType === "") {
    throw new IllegalArgumentError("The eventType is blank.");
  }
  if (eventType === null || eventType === undefined) {
    throw new IllegalArgumentError("The eventType is null.");
  }
  if (dataLocation === null || dataLocation === undefined) {
    throw new IllegalArgumentError("The dataLocation is null.");
  }
  if (iss === null || iss === undefined) {
    throw new IllegalArgumentError("The iss identifier is null.");
  }
  if (entityIDHash === null || entityIDHash === undefined) {
    throw new IllegalArgumentError("The entity identifier hash is null.");
  }
  if (previousEntityHash === null || previousEntityHash === undefined) {
    throw new IllegalArgumentError("The previousEntityHash is null.");
  }
  if (rpcAddress === null || rpcAddress === undefined) {
    throw new IllegalArgumentError("The rpc address is null.");
  }

  try {
    debugLog(">>> Publishing event to blockchain node...");

    debugLog("  > Entry Data:", {
      iss,
      entityIDHash,
      previousEntityHash,
      eventType,
      dataLocation,
      relevantMetadata,
    });

    const provider = new ethers.providers.JsonRpcProvider(rpcAddress);

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    debugLog("  > Ethereum Address of event publisher: ", wallet.address);

    const domeEventsContractWithSigner = new ethers.Contract(
      DOME_EVENTS_CONTRACT_ADDRESS,
      DOME_EVENTS_CONTRACT_ABI,
      wallet
    );

    debugLog("  > Ethereum Contract: ", domeEventsContractWithSigner.address);
    debugLog("  > Ethereum Remittent: ", iss);

    debugLog("  > Publishing event to blockchain node...");
    const tx = await domeEventsContractWithSigner.emitNewEvent(
      iss,
      entityIDHash,
      eventType,
      dataLocation,
      relevantMetadata
    );
    debugLog("  > Transaction waiting to be mined...");
    await tx.wait();
    debugLog("  > Transaction executed:\n" + JSON.stringify(tx));
  } catch (error) {
    errorLog(" > !! Error in publishDOMEEvent");
    throw error;
  }
}

/**
 * Subscribe to DOME Events.
 *
 * @param eventType the event type of the events of interest for the user.
 * @param rpcAddress the blockchain node address to be used for event subscription.
 * @param notificationEndpoint the user's endpoint to be notified to of the events of interest.
 *                             The notification is sent as a POST.
 * @param handler an optional function to handle the events.
 * @param ownIss the organization identifier hash
 */
export function subscribeToDOMEEvents(
  eventTypes: string[],
  rpcAddress: string,
  ownIss: string,
  notificationEndpoint?: string,
  handler?: (event: object) => void
) {
  if (eventTypes === null || eventTypes === undefined) {
    throw new IllegalArgumentError("The eventType is null.");
  }
  if (eventTypes.length === 0) {
    throw new IllegalArgumentError("No eventTypes indicated for subscription.");
  }
  if (eventTypes.includes("")) {
    throw new IllegalArgumentError(
      "Blank eventTypes indicated for subscription."
    );
  }
  if (rpcAddress === null || rpcAddress === undefined) {
    throw new IllegalArgumentError("The rpc address is null.");
  }
  if (ownIss === "") {
    throw new IllegalArgumentError("The ownIss is blank.");
  }
  if (ownIss === null || ownIss === undefined) {
    throw new IllegalArgumentError("The ownIss is null.");
  }

  try {
    debugLog(">>> Subscribing to DOME Events...");

    const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
    const DOMEEventsContract = new ethers.Contract(
      DOME_EVENTS_CONTRACT_ADDRESS,
      DOME_EVENTS_CONTRACT_ABI,
      provider
    );
    debugLog(
      " > Contract with address " + DOME_EVENTS_CONTRACT_ADDRESS + " loaded"
    );
    debugLog(
      " > User requests to subscribe to events..." + eventTypes.join(", ")
    );
    debugLog(" > Listening to events...");

    DOMEEventsContract.on(
      "EventDOMEv1",
      (
        index,
        timestamp,
        origin,
        entityIDHash,
        eventType,
        dataLocation,
        metadata
      ) => {
        const eventContent = {
          id: index,
          publisherAddress: origin,
          entityIDHash: entityIDHash,
          previousEntityIDHash: entityIDHash,
          eventType: eventType,
          timestamp: timestamp,
          dataLocation: dataLocation,
          relevantMetadata: metadata,
        };

        abstractDOMEEventsHandler(eventContent, eventTypes, ownIss, notificationEndpoint, handler);
      }
    );
  } catch (error) {
    errorLog(" > !! Error subscribing to DOME Events");
    throw error;
  }
}

/**
 * Abstract event handler for DOME events that performs all the common handling and calls more specific handlers.
 * @param eventContent the DOME event to be handled.
 * @param eventTypes the event types of interest.
 * @param ownIss the iss identifier of the entity performing the subscription.
 * @param notificationEndpoint the endpoint to be notified of the event.
 * @param handler the specific handler for the event.
 */
function abstractDOMEEventsHandler(eventContent: any, eventTypes: string[], ownIss: string, notificationEndpoint?: string, handler?: (event: object) => void){
        if (!eventTypes.includes(eventContent.eventType)) {
          return;
        }

        debugLog(" > Event Content:", eventContent);
        debugLog(
          " > Event emitted: " +
            eventContent.eventType +
            " with args: " +
            JSON.stringify(eventContent)
        );
        debugLog(
          " > Checking EventType " +
            eventContent.eventType +
            " with the interest for the user " +
            eventContent.eventType
        );

        if (eventContent.publisherAddress === ownIss) {
          debugLog(" > This event is not of interest for the user.");
          return;
        }
        if (notificationEndpoint != undefined) {
          notifyEndpointDOMEEventsHandler(eventContent, notificationEndpoint);
        }
        if (handler != undefined) {
          handler(eventContent);
        }
}

/**
 * Event handler for DOME events that notifies a specified endpoint.
 * @param event the DOME event to be handled.
 * @param notificationEndpoint the endpoint to be notified of the event.
 */
function notifyEndpointDOMEEventsHandler(
  event: object,
  notificationEndpoint: string
) {
  const headers = {
    "Content-Type": "application/json", // Set the Content-Type header to JSON
  };
  debugLog(" > Sending notification to endpoint: " + notificationEndpoint);
  debugLog(" > Notification Content: " + JSON.stringify(event));
  axios
    .post(notificationEndpoint, JSON.stringify(event), {
      headers,
    })
    .then((response) => {
      debugLog(" > Response from notification endpoint: " + response.status);
    })
    .catch((error) => {
      errorLog(" > !! Error from notification endpoint:\n" + error);
      throw new NotificationEndpointError(
        "Can't connect to the notification endpoint."
      );
    });
}

export async function getActiveDOMEEventsByDate(
  startDateMs: number,
  endDateMs: number,
  rpcAddress: string
) {
  let startDate = new Date(startDateMs);
  let endDate = new Date(endDateMs);
  let initTime = new Date();
  debugLog(
    ">>>> Getting active events between " + startDate + " and " + endDate
  );


  const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
  const DOMEEventsContract = new ethers.Contract(
    DOME_EVENTS_CONTRACT_ADDRESS,
    DOME_EVENTS_CONTRACT_ABI,
    provider
  );
  debugLog(">>> Connecting to blockchain node...");
  // Entry parameters in method.
  debugLog("  >> rpcAddress: " + rpcAddress);

  let blockNum = await provider.getBlockNumber();
  debugLog("  >> Blockchain block number is " + blockNum);
  let allDOMEEvents = await DOMEEventsContract.queryFilter(
    "*",
    DOME_PRODUCTION_BLOCK_NUMBER,
    blockNum
  );

  let allActiveEvents: ethers.Event[] = await getAllActiveEvents(allDOMEEvents, DOMEEventsContract, blockNum);

  debugLog("The active DOME Events to be returned are the following:\n");
  let allActiveDOMEEvents: object[] = [];
  type eventJsonType = {
    id: number;
    timestamp: number;
    eventType: string;
    dataLocation: string;
    relevantMetadata: string[];
    entityId: string;
    previousEntityHash: string;
  }
  allActiveEvents.forEach((event) => {
    let eventJson: eventJsonType = {id: 0, timestamp: 0, eventType: "", dataLocation: "", relevantMetadata: [""], entityId: "", previousEntityHash: ""}; 
    for (let i = 0; i < event.args!.length; i++) {
        eventJson.id = event.args![0];
        eventJson.timestamp = event.args![1];
        eventJson.eventType = event.args![4];
        eventJson.dataLocation = event.args![5];
        eventJson.relevantMetadata = event.args![6];
        eventJson.entityId = event.args![3];
        eventJson.previousEntityHash = eventJson.entityId;
    }

    let eventIDHash = event.args![0]._hex;
    let eventTimestampHash = event.args![1]._hex;
    eventJson.id = BigNumber.from(eventIDHash).toNumber();
    eventJson.timestamp = BigNumber.from(eventTimestampHash).toNumber() * 1000;
    debugLog(eventJson);

    allActiveDOMEEvents.push(eventJson);
  });

  let finTime = new Date();
  debugLog("Number of active events is " + allActiveDOMEEvents.length);
  debugLog("***************************************STATS***************************************\n");
  debugLog("Blockchain events processed is " + allDOMEEvents.length);
  debugLog("Processing time was " + (finTime.getTime() - initTime.getTime()) / 1000 / 60);
  debugLog("***********************************************************************************\n");

  return allActiveDOMEEvents;
}


async function getAllActiveEvents(allDOMEEvents: ethers.Event[], DOMEEventsContract: ethers.Contract, actualBlockNumber: number){
  let allActiveEvents: ethers.Event[] = [];
  let alreadyCheckedIDEntityHashes = new Map<string, boolean>();
  let filterEventsByEntityIDHash;
  let eventDateHexBigNumber;
  let eventDateMilisecondsFromEpoch;
  for (let i = 0; i < allDOMEEvents.length; i++) {
    debugLog("  >>> Checking onchain active events...");

    let entityIDHashToFilterWith = allDOMEEvents[i].args![3];
    debugLog("  >> EntityIDHash of event is " + entityIDHashToFilterWith);
    if (!alreadyCheckedIDEntityHashes.has(entityIDHashToFilterWith)) {
      eventDateHexBigNumber = allDOMEEvents[i].args![1]._hex;
      eventDateMilisecondsFromEpoch =
        BigNumber.from(eventDateHexBigNumber).toNumber() * 1000;
      debugLog(
        "  >> Date of event being checked is " +
          new Date(eventDateMilisecondsFromEpoch)
      );
      debugLog(
        "  >> Filtering events with same EntityIDHash to obtain the active one..."
      );
      filterEventsByEntityIDHash = DOMEEventsContract.filters.EventDOMEv1(
        null,
        null,
        null,
        entityIDHashToFilterWith,
        null,
        null,
        null,
        null
      );
      let eventsWithSameEntityIDHash = await DOMEEventsContract.queryFilter(
        filterEventsByEntityIDHash,
        DOME_PRODUCTION_BLOCK_NUMBER,
        actualBlockNumber 
      );
      debugLog(
        "  > The dates of the events with the same EntityIDHash are the following:\n"
      );
      eventsWithSameEntityIDHash.forEach((eventWithSameID) => {
        let eventWithSameIDDateHexBigNumber = eventWithSameID.args![1]._hex;
        let eventWithSameIDDateMilisecondsFromEpoch =
          BigNumber.from(eventWithSameIDDateHexBigNumber).toNumber() * 1000;
        debugLog(new Date(eventWithSameIDDateMilisecondsFromEpoch));
      });

      let activeEvent =
        eventsWithSameEntityIDHash[eventsWithSameEntityIDHash.length - 1];
      debugLog(
        "  > The active event is the event number " +
          eventsWithSameEntityIDHash.length +
          " from the list of event dates showed just before."
      );

      alreadyCheckedIDEntityHashes.set(entityIDHashToFilterWith, true);
      allActiveEvents.push(activeEvent);
      debugLog("  > Updated the list of active events:\n" + allActiveEvents);
    }
  }

  return allActiveEvents;
}