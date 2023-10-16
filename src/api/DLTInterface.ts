import { debug } from "debug";
import { ethers } from "ethers";
import {
    domeEventsContractABI as domeEventsContractABI,
    domeEventsContractAddress as domeEventsContractAddress,
} from "../utils/const";
import axios from "axios";
import { saveSession } from '../db/sessions';

const debugLog = debug("DLT Interface Service: ");

//TODO: Make it generic for any DLT technology.
//TODO: use a proper authenticated session.
//TODO: use persistence for the session.
//TODO: protect methods from exceptions.

/**
 * Configures a blockchain node as the one to be used for the user's session. The session is managed at cookie level.
 * @param rpcAddress the address of the blockchain node.
 * @param userEthereumAddress the user's Ethereum address.
 * @param req the HTTP request.
 */
export async function connectToNode(
    rpcAddress: string,
    userEthereumAddress: string,
    req: any
) {
    debugLog(">>> Connecting to blockchain node...");
    // Entry parameters in method.
    debugLog("  > rpcAddress: " + rpcAddress);
    debugLog("  > userEthereumAddress: " + userEthereumAddress);
    const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
    debugLog("  > Provider: " + JSON.stringify(provider));
    debugLog("  > Provider Network: " + JSON.stringify(await provider.getNetwork()));
    // Registry req parameters in session.
    debugLog("  > req.session: " + JSON.stringify(req.session));
    debugLog("  > req.headers: " + JSON.stringify(req.headers));
    req.session.userEthereumAddress = userEthereumAddress;
    req.session.rpcAddress = rpcAddress;
    debugLog("  > Saving this session.. " + JSON.stringify(req.session));
    saveSession(req.session);
    req.session.provider = provider;
    debugLog("  > Stored blockchain node configuration for this user's session (provider and public key).");
}

/**
 * Publish DOME event as a blockchain event.
 *
 * @param eventType the name of the dome event
 * @param dataLocation the storage or location of the data associated with the event.
 * @param relevantMetadata additional information or metadata relevant to the event.
 * @param userEthereumAddress the user's Ethereum address.
 * @param rpcAddress the address of the blockchain node
 */
export async function publishDOMEEvent(
    eventType: string,
    dataLocation: string,
    relevantMetadata: Array<string>,
    userEthereumAddress: string,
    rpcAddress: string,
) {
    try {
        debugLog(">>> Publishing event to blockchain node...");

        debugLog(">>> Publishing event to blockchain node...");

        debugLog("  > Entry Data:", {
            userEthereumAddress,
            eventType,
            dataLocation,
            relevantMetadata
        });

        const provider = new ethers.providers.JsonRpcProvider(rpcAddress);

        //TODO: Secure PrivateKey
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        debugLog("  > Ethereum Address of event publisher: ", wallet.address);

        const domeEventsContractWithSigner = new ethers.Contract(
            domeEventsContractAddress,
            domeEventsContractABI,
            wallet
        );
        debugLog("  > Ethereum Contract: ", domeEventsContractWithSigner.address);
        debugLog("  > Ethereum Remittent: ", userEthereumAddress);

        const tx = await domeEventsContractWithSigner.emitNewEvent(
            userEthereumAddress,
            eventType,
            dataLocation,
            relevantMetadata
        );
        debugLog("  > Transaction waiting to be mined...");
        await tx.wait();
        debugLog("  > Transaction executed:\n" + JSON.stringify(tx));
    } catch (error) {
        debugLog("  > !! Error publishing event to blockchain node: " + error);
        throw error;
    }
}

/**
 * Subscribe to DOME Events.
 *
 * @param eventType the event type of the events of interest for the user
 * @param rpcAddress the blockchain node address to be used for event subscription.
 * @param notificationEndpoint the user's endpoint to be notified to of the events of interest.
 *                             The notification is sent as a POST.
 * @param userEthereumAddress the user's Ethereum address.
 */
export function subscribeToDOMEEvents(
    eventTypes: string[],
    rpcAddress: string,
    notificationEndpoint: string,
    userEthereumAddress: string
) {

    try {
        debugLog(">>> Subscribing to DOME Events...");
        const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
        const DOMEEventsContract = new ethers.Contract(domeEventsContractAddress, domeEventsContractABI, provider);
        debugLog(" > Contract with address " + domeEventsContractAddress + " loaded");
        debugLog(" > User requests to subscribe to events..." + eventTypes.join(", "));
        debugLog(" > Listening to events...");

        DOMEEventsContract.on("EventDOMEv1", (index, timestamp, origin, eventType, dataLocation, metadata) => {
            if (eventTypes.includes(eventType)) {
                const eventContent = {
                    id: index,
                    publisherAddress: origin,
                    eventType: eventType,
                    timestamp: timestamp,
                    dataLocation: dataLocation,
                    relevantMetadata: metadata
                }

                debugLog(" > Event Content:", {
                    index,
                    timestamp,
                    origin,
                    eventType,
                    dataLocation,
                    metadata
                });

                debugLog(" > Event emitted: " + eventType + " with args: " + JSON.stringify(eventContent));


                if (eventContent.publisherAddress != userEthereumAddress) {
                    const headers = {
                        'Content-Type': 'application/json', // Set the Content-Type header to JSON
                    };
                    debugLog(" > Sending notification to endpoint: " + notificationEndpoint);
                    debugLog(" > Notification Content: " + JSON.stringify(eventContent));
                    axios.post(notificationEndpoint, JSON.stringify(eventContent), { headers })
                        .then(response => {
                            debugLog(" > Response from notification endpoint: " + response.status);
                        })
                        .catch(error => {
                            debugLog(" > Error from notification endpoint: " + error);
                        });
                } else {
                    debugLog(" > This event is not of interest for the user.");
                }
            }
        });
    } catch (error) {
        debugLog(" > !! Error subscribing to DOME Events: " + error);
        throw error;
    }
}