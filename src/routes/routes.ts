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
    req.body.dataLocation,
    req.body.relevantMetadata,
    req.session.userEthereumAddress,
    req.session.rpcAddress
  );
  resp.status(200).send("OK");
});

router.post('/api/v1/subscribe', async (req: any, resp: any) => {
  subscribeToDOMEEvent(req.body.eventType, req.session.rpcAddress, req.body.notificationEndpoint);
  resp.status(200).send("OK");
})

// router.post('/api/v1/testSubscribedUser', async (req: any, resp: any ) => { 
//     resp.status(200).send("Subscribed user NOTIFIED of EVENT");
// })

export = router;
