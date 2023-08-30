import { debug } from "debug";
const debugLog = debug("DLTInterface:API");

import { ethers } from "ethers";
import { domeEventsContractABI as domeEventsContractABI, domeEventsContractAddress as domeEventsContractAddress } from "../utils/const";
import axios  from "axios"

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
 * @param eventTimeStamp the exact time when the event is built
 * @param eventDataLocation the storage or location of the data associated whit the event.
 * @param eventRelevantMetadata additional information or metadata relevant to the event.
 * @param provider the blockchain node to connect to.
 * @param userEthereumAddress the user's Ethereum address.
 * @param rpcAddress the address of the blockchain node
 */
export async function publishDOMEEvent(

  eventType: string,
  eventTimeStamp: string,
  eventDataLocation: string,
  eventRelevantMetadata: Array<string>,
  provider: ethers.providers.JsonRpcProvider,
  userEthereumAddress: string,
  rpcAddress: string
) {
  debugLog("Connected to node " + rpcAddress);

  //TODO: Securize PrivateKey
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  //TODO: Use Alexander's contracts for event publication.
  //TODO: Use constants from a utils file for these.
  const domeEventsContractAddress = "CONTRACT_ADDRESS";
  const domeEventsContractABI = [
    "function publishDomeEvent(string domeEventType, string domeEventTimeStamp, string domeEventDataLocation, string domeEventRelevantMetadata)",
  ];
  const domeEventsContractWithSigner = new ethers.Contract(
    domeEventsContractAddress,
    domeEventsContractABI,
    wallet
  );
  debugLog("Ethereum address of event publisher is " + wallet.getAddress());
  debugLog(
    "Ethereum address of user that requested event publishing is " +
      userEthereumAddress
  );

  const tx = domeEventsContractWithSigner.publishDomeEvent(
    eventType,
    eventTimeStamp,
    eventDataLocation,
    eventRelevantMetadata,
    userEthereumAddress
  );
  await tx.wait();
  debugLog("Transaction executed:\n" + tx);
}

/**
 * Subscribe to DOME Events.
 * 
 * @param domeEventType the event type of the events of interest for the user
 * @param notificationEndpoint the user's endpoint to be notified to of the events of interest.
 *                             The notification is sent as a POST.
 * @param provider the blockchain node to be used for event subscription. 
 * @param req the HTTP request.
 */
export function subscribeToDOMEEvent(domeEventType: string, notificationEndpoint: string, provider: ethers.providers.JsonRpcProvider) {
    // provider = new ethers.providers.InfuraProvider(
    //     "goerli",
    //     "8bc45627f563458abd4193d30c143117"
    // );
    const DOMEEventsContract = new ethers.Contract(domeEventsContractAddress, domeEventsContractABI, provider);
    debugLog("Contract with address " + domeEventsContractAddress + " loaded")
    DOMEEventsContract.on(domeEventType, (eventArgs) => {
        debugLog("Event emitted: " + domeEventType + " with args: " + JSON.stringify(eventArgs));
        axios.post(notificationEndpoint, JSON.stringify(eventArgs))
    });
}
