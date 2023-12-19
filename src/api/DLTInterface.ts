import { debug } from "debug";
import { BigNumber, ethers } from "ethers";
import {
  DOME_PRODUCTION_BLOCK_NUMBER,
  DOME_EVENTS_CONTRACT_ABI as DOME_EVENTS_CONTRACT_ABI,
  DOME_EVENTS_CONTRACT_ADDRESS as DOME_EVENTS_CONTRACT_ADDRESS,
} from "../utils/const";
import axios from "axios";

import { IllegalArgumentError } from "../exceptions/IllegalArgumentError";
import { NotificationEndpointError } from "../exceptions/NotificationEndpointError";

const debugLog = debug("DLT Interface Service: ");
const errorLog = debug("DLT Interface Service:error ");

//TODO: Make it generic for any DLT technology.
//TODO: use a proper authenticated session.
//TODO: use persistence for the session.
//TODO: protect methods from exceptions.

/**
 * Configures a blockchain node as the one to be used for the user's session. The session is managed at cookie level.
 * @param rpcAddress the address of the blockchain node.
 * @param iss the organization identifier hash
 * @param req the HTTP request.
 */
export async function connectToNode(rpcAddress: string, iss: string, req: any) {
  if (rpcAddress === null || rpcAddress === undefined) {
    throw new IllegalArgumentError("The rpc address is null.");
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

    //TODO: Secure PrivateKey
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
 * @param iss the organization identifier hash
 */
export function subscribeToDOMEEvents(
  eventTypes: string[],
  rpcAddress: string,
  notificationEndpoint: string,
  iss: string
) {
  if (eventTypes === null || eventTypes === undefined) {
    throw new IllegalArgumentError("The eventType is null.");
  }
  if (eventTypes.length === 0) {
    throw new IllegalArgumentError("No eventTypes indicated for subscription.");
  }
  if (rpcAddress === null || rpcAddress === undefined) {
    throw new IllegalArgumentError("The rpc address is null.");
  }
  if (notificationEndpoint === null || notificationEndpoint === undefined) {
    throw new IllegalArgumentError("The notificationEndpoint is null.");
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
        if (eventTypes.includes(eventType)) {
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

          debugLog(" > Event Content:", {
            index,
            timestamp,
            origin,
            entityIDHash,
            eventType,
            dataLocation,
            metadata,
          });

          debugLog(
            " > Event emitted: " +
              eventType +
              " with args: " +
              JSON.stringify(eventContent)
          );
          debugLog(
            " > Checking EventType " +
              eventContent.eventType +
              " with the interest for the user " +
              eventType
          );

          if (eventContent.publisherAddress != iss) {
            const headers = {
              "Content-Type": "application/json", // Set the Content-Type header to JSON
            };
            debugLog(
              " > Sending notification to endpoint: " + notificationEndpoint
            );
            debugLog(
              " > Notification Content: " + JSON.stringify(eventContent)
            );
            axios
              .post(notificationEndpoint, JSON.stringify(eventContent), {
                headers,
              })
              .then((response) => {
                debugLog(
                  " > Response from notification endpoint: " + response.status
                );
              })
              .catch((error) => {
                errorLog(" > !! Error from notification endpoint:\n" + error);
                throw new NotificationEndpointError(
                  "Can't connect to the notification endpoint."
                );
              });
          } else {
            debugLog(" > This event is not of interest for the user.");
          }
        }
      }
    );
  } catch (error) {
    errorLog(" > !! Error subscribing to DOME Events");
    throw error;
  }
}

export async function getActiveDOMEEventsByDate(
  startDateMs: number,
  endDateMs: number,
  rpcAddress: string
) {
  let startDate = new Date(startDateMs);
  let endDate = new Date(endDateMs);
  debugLog(
    ">>>> Getting active events between " + startDate + " and " + endDate
  );

  let allActiveEvents: ethers.Event[] = [];
  let alreadyCheckedIDEntityHashes = new Map<string, boolean>();

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
        blockNum
      );
      debugLog(
        "  > The dates of the events with the same EntityIDHash are the following:\n"
      );
      await eventsWithSameEntityIDHash.forEach((eventWithSameID) => {
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

      if (
        !allActiveEvents.find(
          (event: any) => event.args[3] === entityIDHashToFilterWith
        )
      ) {
        allActiveEvents.push(activeEvent);
        debugLog("  > Updated the list of active events:\n" + allActiveEvents);
      }
    }
  }

  let allActiveDOMEEvents: object[] = [];
  await allActiveEvents.forEach((event) => {
    let eventJson = JSON.parse(JSON.stringify(event));
    console.log(JSON.stringify(event));
    let eventIndexHex = event.args![0]._hex;
    let eventTimestampHex = event.args![1]._hex;
    eventJson.args![0] = BigNumber.from(eventIndexHex).toNumber();
    eventJson.args![1] = BigNumber.from(eventTimestampHex).toNumber() * 1000;
    allActiveDOMEEvents.push(eventJson.args);
  });

  debugLog("The active DOME Events to be returned are the following:\n");
  debugLog(await allActiveEvents);
  return allActiveDOMEEvents;
}
