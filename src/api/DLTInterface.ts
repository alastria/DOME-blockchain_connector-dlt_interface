let binarySearch = require("binary-search");
import {debug} from "debug";
import {BigNumber, ethers} from "ethers";
import axios from "axios";

import {IllegalArgumentError} from "../exceptions/IllegalArgumentError";
import {NotificationEndpointError} from "../exceptions/NotificationEndpointError";
import {getIndexOfFirstAppearanceOfElement, getIndexOfLastAppearanceOfElement} from "../utils/funcs";
import {DOMEEvent} from "../utils/types";

const debugLog = debug("DLT_Interface_Service:");
const errorLog = debug("DLT_Interface_Service:error");

/**
 * Publish DOME event as a blockchain event.
 *
 * @param eventType the name of the dome event
 * @param dataLocation the storage or location of the data associated with the event.
 * @param relevantMetadata additional information or metadata relevant to the event.
 * @param iss the organization identifier hash
 * @param rpcAddress the address of the blockchain node
 * @param entityIDHash entity identifier hash
 * @returns the timestamp of the block where the event was published to.
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
    if (dataLocation === "") {
        throw new IllegalArgumentError("The dataLocation is blank.");
    }
    if (dataLocation === null || dataLocation === undefined) {
        throw new IllegalArgumentError("The dataLocation is null.");
    }
    if (iss === "") {
        throw new IllegalArgumentError("The iss identifier is blank.");
    }
    if (iss === null || iss === undefined) {
        throw new IllegalArgumentError("The iss identifier is null.");
    }
    if (entityIDHash === "") {
        throw new IllegalArgumentError("The entity identifier hash is blank.");
    }
    if (entityIDHash === null || entityIDHash === undefined) {
        throw new IllegalArgumentError("The entity identifier hash is null.");
    }
    if (previousEntityHash === null || previousEntityHash === undefined) {
        throw new IllegalArgumentError("The previousEntityHash is null.");
    }
    if (rpcAddress === "") {
        throw new IllegalArgumentError("The rpc address is null.");
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
        debugLog("  > Connecting to blockchain node with address: " + rpcAddress);

        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        debugLog("  > Ethereum Public Key of event publisher: ", wallet.publicKey);
        debugLog("  > Ethereum Address of event publisher: ", wallet.address);

        const domeEventsContractWithSigner = new ethers.Contract(
            process.env.DOME_EVENTS_CONTRACT_ADDRESS!,
            process.env.DOME_EVENTS_CONTRACT_ABI!,
            wallet
        );

        debugLog("  > Ethereum Contract: ", domeEventsContractWithSigner.address);
        debugLog("  > Ethereum Remittent: ", iss);

        debugLog("  > Publishing event to blockchain node...");
        const tx = await domeEventsContractWithSigner.emitNewEvent(
            iss,
            wallet.address.toString(),
            entityIDHash,
            previousEntityHash,
            eventType,
            dataLocation,
            relevantMetadata
        );
        debugLog("  > Transaction waiting to be mined...");
        await tx.wait();
        debugLog("  > Transaction executed:\n" + JSON.stringify(tx));
        return (await provider.getBlock((await provider.getTransaction(tx.hash)).blockNumber!)).timestamp;
    } catch (error) {
        errorLog(" > !! Error in publishDOMEEvent");
        throw error;
    }
}

/**
 * Subscribe to DOME Events.
 *
 * @param eventTypes the event type/s of the events of interest for the user.
 * @param rpcAddress the blockchain node address to be used for event subscription.
 * @param metadataOfInterest the environment of interest for the user.
 * @param notificationEndpoint the user's endpoint to be notified to of the events of interest.
 *                             The notification is sent as a POST.
 * @param handler an optional function to handle the events.
 * @param ownIss the organization identifier hash
 */
export function subscribeToDOMEEvents(
    eventTypes: string[],
    metadataOfInterest: string[],
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
    if (metadataOfInterest === null || metadataOfInterest === undefined || metadataOfInterest.length === 0) {
        throw new IllegalArgumentError("The metadata is not set. Set the environment to work with.");
    }
    if (metadataOfInterest.includes("")) {
        throw new IllegalArgumentError("The metadata is blank.");
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
            process.env.DOME_EVENTS_CONTRACT_ADDRESS!,
            process.env.DOME_EVENTS_CONTRACT_ABI!,
            provider
        );
        debugLog(
            " > Contract with address " + process.env.DOME_EVENTS_CONTRACT_ADDRESS! + " loaded"
        );
        debugLog(
            " > User requests to subscribe to events of type " + eventTypes.join(", ") + " and environment  " + metadataOfInterest.join(", ")
        );
        debugLog(" > Listening to events...");

        DOMEEventsContract.on(
            "EventDOMEv1",
            (
                index,
                timestamp,
                publisherAddress,
                authorAddress,
                entityIDHash,
                previousEntityHash,
                eventType,
                dataLocation,
                metadata
            ) => {
                let parsedId = BigNumber.from(index._hex).toNumber();
                let parsedTimestamp = BigNumber.from(timestamp._hex).toNumber();
                const eventContent = {
                    id: parsedId,
                    ethereumAddress: authorAddress,
                    publisherAddress: publisherAddress,
                    entityIDHash: entityIDHash,
                    previousEntityHash: previousEntityHash,
                    eventType: eventType,
                    timestamp: parsedTimestamp,
                    dataLocation: dataLocation,
                    relevantMetadata: metadata,
                };

                abstractDOMEEventsHandler(eventContent, eventTypes, metadataOfInterest, ownIss, notificationEndpoint, handler);
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
function abstractDOMEEventsHandler(eventContent: any, eventTypes: string[], metadata: string[], ownIss: string, notificationEndpoint?: string, handler?: (event: object) => void) {
    debugLog(
        " > Checking EventType " +
        eventContent.eventType +
        " with the interest for the user " +
        eventTypes
    );

    if (!eventTypes.includes(eventContent.eventType)) {
        debugLog(" > This event is not of interest for the user. It is of a different type than the\
    ones established.");
        return;
    }

    debugLog(
        " > Checking env metadata " +
        eventContent.relevantMetadata +
        " with the interest for the user " +
        metadata
    );
    if (metadata.includes("sbx") && !eventContent.relevantMetadata.includes("sbx")) {
        debugLog(" > This event is not of interest for the user. It is related to an env different than the one's of interest");
        return;
    }
    if (metadata.includes("prd") && !eventContent.relevantMetadata.includes("prd")) {
        debugLog(" > This event is not of interest for the user. It is related to an env different than the one's of interest");
        return;
    }
    if (metadata.includes("dev") && !eventContent.relevantMetadata.includes("dev")) {
        debugLog(" > This event is not of interest for the user. It is related to an env different than the one's\
  of interest");
        return;
    }

    debugLog(
        " > Event emitted with content: \n" +
        JSON.stringify(eventContent)
    );


    if (eventContent.publisherAddress === ownIss) {
        debugLog(" > This event is not of interest for the user. It was published by the user itself.");
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

/**
 * Returns all the DOME active events from the blockchain between given dates
 * @param startDateMs the given start date in miliseconds
 * @param endDateMs the given end date in miliseconds
 * @param endDateMs
 * @param envMetadataOfInterest
 * @param rpcAddress
 * @returns a JSON with all the DOME active events from the blockchain between the given dates with its timestamp truncated to seconds, not to miliseconds
 */
export async function getActiveDOMEEventsByDate(
    startDateMs: number,
    endDateMs: number,
    envMetadataOfInterest: string,
    rpcAddress: string
): Promise<DOMEEvent[]> {

    if (rpcAddress === "") {
        throw new IllegalArgumentError("The rpc address is blank.");
    }

    if (startDateMs > endDateMs) {
        throw new IllegalArgumentError("The end date can't be lower than the start date.");
    }

    let startDateSeconds = Math.trunc(startDateMs / 1000);
    let endDateSeconds = Math.trunc(endDateMs / 1000);
    let startDate = new Date(parseInt(startDateMs.toString()));
    let endDate = new Date(parseInt(endDateMs.toString()));
    let initTime = new Date();

    debugLog(
        ">>>> Getting active events between " + startDate + " and " + endDate
    );

    const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
    const DOMEEventsContract = new ethers.Contract(
        process.env.DOME_EVENTS_CONTRACT_ADDRESS!,
        process.env.DOME_EVENTS_CONTRACT_ABI!,
        provider
    );

    debugLog(">>> Connecting to blockchain node...");
    // Entry parameters in method.
    debugLog("  >> rpcAddress: " + rpcAddress);

    let blockNum = await provider.getBlockNumber();
    debugLog("  >> Blockchain block number is " + blockNum);
    let allDOMEEvents = await DOMEEventsContract.queryFilter(
        "*",
        parseInt(process.env.DOME_PRODUCTION_BLOCK_NUMBER!),
        blockNum
    );
    let allDOMEEventsTimestamps: number[] = [];
    allDOMEEvents = allDOMEEvents.slice(1);
    allDOMEEvents.forEach((event) => {
        allDOMEEventsTimestamps.push(BigNumber.from(event.args![1]._hex).toNumber())
    });

    let indexOfFirstEventToCheck: number = -1;
    let indexOfLastEventToCheck: number = -1;
    for (let i = 0; i <= (endDateSeconds - startDateSeconds) && (indexOfFirstEventToCheck < 0); i++) {
        indexOfFirstEventToCheck = binarySearch(allDOMEEventsTimestamps, startDateSeconds + i, function (element: any, needle: any) {
            return element - needle;
        });
    }
    for (let i = 0; i <= (endDateSeconds - startDateSeconds) && (indexOfLastEventToCheck < 0); i++) {
        indexOfLastEventToCheck = binarySearch(allDOMEEventsTimestamps, endDateSeconds - i, function (element: any, needle: any) {
            return element - needle;
        });
    }

    if (indexOfFirstEventToCheck < 0 || indexOfLastEventToCheck < 0) {
        return [];
    }

    indexOfFirstEventToCheck = getIndexOfFirstAppearanceOfElement(allDOMEEventsTimestamps, indexOfFirstEventToCheck);
    indexOfLastEventToCheck = getIndexOfLastAppearanceOfElement(allDOMEEventsTimestamps, indexOfLastEventToCheck);
    let allDOMEEventsBetweenDates = allDOMEEvents.slice(indexOfFirstEventToCheck, indexOfLastEventToCheck + 1);

    let allActiveEvents: ethers.Event[] = await getAllActiveDOMEBlockchainEventsBetweenDates(allDOMEEventsBetweenDates, DOMEEventsContract, blockNum, startDateSeconds, endDateSeconds, envMetadataOfInterest);

    debugLog("The active DOME Events to be returned are the following:\n");
    let allActiveDOMEEvents: DOMEEvent[] = [];

    allActiveEvents.forEach((event) => {
        let eventJson: DOMEEvent = {
            id: 0,
            ethereumAddress: "",
            publisherAddress: "",
            timestamp: 0,
            eventType: "",
            dataLocation: "",
            relevantMetadata: [""],
            entityId: "",
            previousEntityHash: ""
        };
        eventJson.id = event.args![0];
        eventJson.ethereumAddress = event.args![3];
        eventJson.publisherAddress = event.args![2];
        eventJson.timestamp = event.args![1];
        eventJson.eventType = event.args![6];
        eventJson.dataLocation = event.args![7];
        eventJson.relevantMetadata = event.args![8];
        eventJson.entityId = event.args![4];
        eventJson.previousEntityHash = event.args![5];

        let eventIDHash = event.args![0]._hex;
        let eventTimestampHash = event.args![1]._hex;
        eventJson.id = BigNumber.from(eventIDHash).toNumber();
        eventJson.timestamp = BigNumber.from(eventTimestampHash).toNumber() * 1000;
        debugLog(eventJson);

        allActiveDOMEEvents.push(eventJson);
    });

    debugLog("Number of active events is " + allActiveDOMEEvents.length + "\n");
    let finTime = new Date();

    debugLog("***************************************STATS***************************************");
    debugLog("Total blockchain events are " + allDOMEEvents.length);
    debugLog("Processed blockchain events are " + allDOMEEventsBetweenDates.length);
    debugLog("Processing time was " + (finTime.getTime() - initTime.getTime()) / 1000 / 60);
    debugLog("***********************************************************************************\n");

    return allActiveDOMEEvents;
}


/**
 * Returns all the DOME active blockchain events from the blockchain between given dates
 * @param DOMEEvents some DOME blockchain events
 * @param DOMEEventsContract the DOME Event's contract.
 * @param actualBlockNumber the actual block number of the blockchain
 * @param startDateSeconds the given start date in seconds
 * @param endDateSeconds the given end date in seconds
 * @param metadataOfInterest
 * @returns an Array with all the DOME active blockchain events from the blockchain between the given dates
 */
async function getAllActiveDOMEBlockchainEventsBetweenDates(DOMEEvents: ethers.Event[], DOMEEventsContract: ethers.Contract, actualBlockNumber: number, startDateSeconds: number, endDateSeconds: number, metadataOfInterest: string) {
    let activeEvents: ethers.Event[] = [];
    let alreadyCheckedIDEntityHashes = new Map<string, boolean>();
    let filterEventsByEntityIDHash;
    let eventDateHexBigNumber;
    let eventDateMilisecondsFromEpoch;
    for (let domeEvent of DOMEEvents) {
        debugLog("  >>> Checking onchain active events...");

        let entityIDHashToFilterWith = domeEvent.args![4];
        debugLog("  >> EntityIDHash of event is " + entityIDHashToFilterWith);
        if (!alreadyCheckedIDEntityHashes.has(entityIDHashToFilterWith)) {
            eventDateHexBigNumber = domeEvent.args![1]._hex;
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
                null,
                entityIDHashToFilterWith,
                null,
                null,
                null,
                null
            );
            let eventsWithSameEntityIDHash = await DOMEEventsContract.queryFilter(
                filterEventsByEntityIDHash,
                parseInt(process.env.DOME_PRODUCTION_BLOCK_NUMBER!),
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
            for (let i = 0; i < eventsWithSameEntityIDHash.length; i++) {
                let eventWithSameIDHashTimestampSeconds = BigNumber.from(eventsWithSameEntityIDHash[eventsWithSameEntityIDHash.length - 1 - i].args![1]._hex).toNumber()
                if (eventWithSameIDHashTimestampSeconds >= startDateSeconds && eventWithSameIDHashTimestampSeconds <= endDateSeconds) {
                    activeEvent = eventsWithSameEntityIDHash[eventsWithSameEntityIDHash.length - 1 - i];
                    break;
                }
            }
            debugLog(
                "  > The active event is the event number " +
                eventsWithSameEntityIDHash.length +
                " from the list of event dates showed just before."
            );

            alreadyCheckedIDEntityHashes.set(entityIDHashToFilterWith, true);
            // solving problems, from IN2 :* - java rules
            let envMetadata : string[] = Array.of(metadataOfInterest)
            if (isAnEventOfInterest(activeEvent.args![8], envMetadata)) {
                activeEvents.push(activeEvent);
                debugLog("  > Updated the list of active events:\n" + activeEvents);
            }
        }
    }

    return activeEvents;
}

function isAnEventOfInterest(eventMetadata: string[], metadataOfInterest: string[]): boolean {
    if (metadataOfInterest.includes("sbx") && eventMetadata.includes("sbx")) {
        return true;
    }
    if (metadataOfInterest.includes("prd") && eventMetadata.includes("prd")) {
        return true;
    }
    if (metadataOfInterest.includes("dev") && eventMetadata.includes("dev")) {
        return true;
    }

    debugLog(" > This event is not of interest for the user. It is related to an env different than the one's of interest");
    return false;
}