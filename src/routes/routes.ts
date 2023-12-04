import { connectToNode, subscribeToDOMEEvents, publishDOMEEvent } from "../api/DLTInterface";
import express from "express";
import debug from "debug";


const router = express.Router();
const debugLog = debug("Routes: ");
const errorLog = debug("Routes:error ");

router.get("/health", async (req: any, resp: any) => {
  const healthCheckResponse = {
    status: "UP",
    checks: [
      {
        name: "Blockchain connector health check",
        status: "UP"
      }
    ]
  };
  resp.status(200).json(healthCheckResponse);
});

router.post("/api/v1/configureNode", async (req: any, resp: any) => {
  debugLog("Entry call from origin: ", req.headers.origin);
  try {
    await connectToNode(req.body.rpcAddress, req.body.iss, req);
    resp.status(200).send("OK");
  } catch (error: any) {
    if (error == IllegalArgumentError) {
      errorLog("Error:\n ", error);
      resp.status(400).send(error.message);
    }

    errorLog("Error:\n ", error);
    resp.status(400).send("Error connecting to the blockchain node.");
  }
});

router.post("/api/v1/publishEvent", async (req: any, resp: any) => {
  debugLog("Entry call from origin: ", req.headers.origin);
  try {
    await publishDOMEEvent(
        req.body.eventType,
        req.body.dataLocation,
        req.body.relevantMetadata,
        req.body.previousEntityHash,
        req.session.iss,
        req.session.rpcAddress
    );
    resp.status(200).send("OK");
  } catch (error: any) {
    if (error == IllegalArgumentError) {
      errorLog("Error:\n ", error);
      resp.status(400).send(error.message);
    }

    errorLog("Error:\n ", error);
    resp.status(400).send("Error connecting to the blockchain node.");
  }
});

router.post('/api/v1/subscribe', async (req: any, resp: any) => {
  debugLog("Entry call from origin: ", req.headers.origin);
  try {
    subscribeToDOMEEvents(req.body.eventTypes, req.session.rpcAddress, req.body.notificationEndpoint, req.session.iss);
    resp.status(200).send("OK");
  } catch (error: any) {
    if (error == NotificationEndpointError) {
      errorLog("Error:\n ", error);
      resp.status(400).send(error.message);
    }

    debugLog("Error:\n ", error);
    resp.status(400).send("Error connecting to the blockchain node.");
  }
})

export = router;
