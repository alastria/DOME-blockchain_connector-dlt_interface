import { debug } from "debug";
const debugLog = debug("DLTInterface:API");

import { ethers } from "ethers";
import {
  domeEventsContractABI as domeEventsContractABI,
  domeEventsContractAddress as domeEventsContractAddress,
} from "../utils/const";
import axios from "axios";

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
export function connectToNode(
  rpcAddress: string,
  userEthereumAddress: string,
  req: any
) {
  const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
  debugLog("Provider:" + provider);
  debugLog("Connected to blockchain node with address " + rpcAddress);
  debugLog("User public key is " + userEthereumAddress);

  req.session.provider = provider;
  req.session.userEthereumAddress = userEthereumAddress;
  req.session.rpcAddress = rpcAddress;
  debugLog(
    "Stored blockchain node configuration for this user's session (provider and public key)."
  );
}

/**
 * Publish DOME event as a blockchain event.
 *
 * @param eventType the name of the dome event
 * @param eventDataLocation the storage or location of the data associated whit the event.
 * @param eventRelevantMetadata additional information or metadata relevant to the event.
 * @param userEthereumAddress the user's Ethereum address.
 * @param rpcAddress the address of the blockchain node
 */
export async function publishDOMEEvent(
  eventType: string,
  eventDataLocation: string,
  eventRelevantMetadata: Array<string>,
  userEthereumAddress: string,
  rpcAddress: string
) {
  const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
  debugLog("Connected to node " + rpcAddress);

  //TODO: Securize PrivateKey
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const domeEventsContractWithSigner = new ethers.Contract(
    domeEventsContractAddress,
    domeEventsContractABI,
    wallet
  );
  debugLog("Ethereum address of event publisher is " + await wallet.getAddress());
  debugLog(
    "Ethereum address of user that requested event publishing is " +
      userEthereumAddress
  );
  debugLog("Event type published is " + eventType)

  //TODO: Consider using our own Timestamp instead of the smart contract one for more flexibility
  //TODO: Consider using our own ID instead of the smart contract one for more flexibility
  const tx = await domeEventsContractWithSigner.emitNewEvent(
    userEthereumAddress,
    eventType,
    eventDataLocation,
    eventRelevantMetadata
  );
  await tx.wait();
  debugLog("Transaction executed:\n" + JSON.stringify(tx));
}

/**
 * Subscribe to DOME Events.
 *
 * @param eventType the event type of the events of interest for the user
 * @param rpcAddress the blockchain node address to be used for event subscription.
 * @param notificationEndpoint the user's endpoint to be notified to of the events of interest.
 *                             The notification is sent as a POST.
 */
export function subscribeToDOMEEvent(
  eventType: string,
  rpcAddress: string,
  notificationEndpoint: string
) {
  const provider = new ethers.providers.JsonRpcProvider(rpcAddress);
  // const provider = new ethers.providers.InfuraProvider(
  //     "goerli",
  //     "8bc45627f563458abd4193d30c143117"
  // );
    const DOMEEventsContract = new ethers.Contract(domeEventsContractAddress, domeEventsContractABI, provider);
    debugLog("Contract with address " + domeEventsContractAddress + " loaded");
    debugLog("User subscribed to event of type " + eventType);
    DOMEEventsContract.on("EventDOMEv1", (index, timestamp, origin, eventType, dataLocation, metadata) => {
        const eventContent = {
          id: index,
          publisherAddress: origin,
          eventType: eventType,
          eventTimestamp: timestamp,
          eventDataLocation: dataLocation,
          eventRelevantMetadata: metadata
        }
        if(eventContent.eventType == eventType){
          debugLog("Event emitted: " + eventType + " with args: " + JSON.stringify(eventContent));
          axios.post(notificationEndpoint, JSON.stringify(eventContent))
        }
    });
}
