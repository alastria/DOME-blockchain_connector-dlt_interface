import { connectToNode, subscribeToDOMEEvents, publishDOMEEvent } from "../api/DLTInterface";
import express from "express";
import debug from "debug";
import { getSessionByISS } from '../db/sessions';


import { IllegalArgumentError } from "../exceptions/IllegalArgumentError";
import { NotificationEndpointError } from "../exceptions/NotificationEndpointError";

const router = express.Router();
const debugLog = debug("Routes: ");
const errorLog = debug("Routes:error ");

router.get("/health", (req: any, resp: any) => {
  const healthCheckResponse = {
    status: "UP",
    checks: [
      {
        name: "Blockchain connector health check",
        status: "UP",
      },
    ],
  };
  resp.status(200).json(healthCheckResponse);
});

router.post("/api/v1/configureNode", (req: any, resp: any) => {
  (async () => {
    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      await connectToNode(req.body.rpcAddress, req.body.iss, req);
      resp.status(201).send("OK");
    } catch (error: any) {
      if (error == IllegalArgumentError) {
        errorLog("Error:\n ", error);
        resp.status(400).send(error.message);
      }

      errorLog("Error:\n ", error);
      resp.status(400).send("Error connecting to the blockchain node.");
    }
  })();
});

router.post("/api/v1/publishEvent", (req: any, resp: any) => {
  (async () => {
    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      await publishDOMEEvent(
        req.body.eventType,
        req.body.dataLocation,
        req.body.relevantMetadata,
        req.session.iss,
        req.body.entityId,
        req.body.previousEntityHash,
        req.session.rpcAddress
      );
      resp.status(201).send("OK");
    } catch (error: any) {
      if (error == IllegalArgumentError) {
        errorLog("Error:\n ", error);
        resp.status(400).send(error.message);
      }

      errorLog("Error:\n ", error);
      resp.status(400).send("Error connecting to the blockchain node.");
    }
  })();
});

router.post("/api/v1/subscribe", (req: any, resp: any) => {
  (async () => {
    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      subscribeToDOMEEvents(
        req.body.eventTypes,
        req.session.rpcAddress,
        req.session.iss,
        req.body.notificationEndpoint,
      );
      resp.status(201).send("OK");
    } catch (error: any) {
      if (error == NotificationEndpointError) {
        errorLog("Error:\n ", error);
        resp.status(400).send(error.message);
      }

      debugLog("Error:\n ", error);
      resp.status(400).send("Error connecting to the blockchain node.");
    }
  })();
});


router.get('/getSessionByISS', async (req, resp) => {

  try {
    const userAddress = req.body.userEthereumAddress;
    const session = await getSessionByISS(userAddress, req);
    if (session == 0) {
      return resp.status(404).send("Session not found");
    }else{
      return resp.status(200).send("OK");
    }
  } catch (error) {
    debugLog("Error: ", error);
    resp.status(400);
  }
})


export = router;
