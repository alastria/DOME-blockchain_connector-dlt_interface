import { connectToNode, subscribeToDOMEEvent, publishDOMEEvent } from "../api/DLTInterface";

const express = require("express")
const router = express.Router();

router.get("/api/v1/check", async (req: any, resp: any) => {
  resp.status(200).send("OK");
});

router.post("/api/v1/configureNode", async (req: any, resp: any) => {
  connectToNode(req.body.rpcAddress, req.body.publicKeyHex, req);
  resp.status(200).send("OK");
});

router.post("/api/v1/publishEvent", async (req: any, resp: any) => {
  publishDOMEEvent(
    req.body.eventType,
    req.body.eventTimeStamp,
    req.body.eventDataLocation,
    req.body.eventRelevantMetadata,
    req.session.provider,
    req.session.userEthereumAddress,
    req.session.rpcAddress
  );
  resp.status(200).send("OK");
});

router.post('/api/v1/subscribe', async (req: any, resp: any) => {
  subscribeToDOMEEvent(req.body.domeEventType, req.body.notificationEndpoint, req.body.provider);
  resp.status(200).send("OK");
})

// router.post('/api/v1/testSubscribedUser', async (req: any, resp: any ) => { 
//     resp.status(200).send("Subscribed user NOTIFIED of EVENT");
// })

export = router;
