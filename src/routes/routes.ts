import { subscribeToDOMEEvents, publishDOMEEvent, getActiveDOMEEventsByDate, getActiveSubscriptions, subscribeToAllDOMEEvents } from "../api/DLTInterface";
import express from "express";
import debug from "debug";
import { IllegalArgumentError } from "../exceptions/IllegalArgumentError";
import { NotificationEndpointError } from "../exceptions/NotificationEndpointError";

const router = express.Router();
const debugLog = debug("Routes: ");
const errorLog = debug("Routes:error ");

/**
 * @swagger
 * tags:
 *   - name: DLT Adapter
 * components:
 *   schemas:
 *     v1_publishEvent_body:
 *       type: object
 *       properties:
 *         eventType:
 *           type: string
 *         dataLocation:
 *           type: string
 *         relevantMetadata:
 *           type: array
 *           items:
 *             type: string
 *         entityId:
 *           type: string
 *         previousEntityHash:
 *           type: string
 *     v1_subscribe_body:
 *       type: object
 *       properties:
 *         notificationEndpoint:
 *           type: string
 *         eventTypes:
 *           type: array
 *           items:
 *             type: string
 *     v1_subscription_schema:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           eventTypes:
 *             type: array
 *             items:
 *               type: string
 *           metadata:
 *             type: array
 *             items:
 *               type: string
 *     v2_subscribe_all_body:
 *       type: object
 *       properties:
 *         notificationEndpoint:
 *           type: string
 */

/**
 * @swagger
 * /health:
 *  get:
 *    description: Healthcheck endpoint
 *    tags:
 *      - DLT Adapter
 *    responses:
 *      '200':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example:
 *              status: UP
 *              checks:
 *                - name: DLT Adapter health check
 *                  status: UP
 *    servers:
 *      - url: http://localhost:8080
 */
router.get("/health", (req: any, resp: any) => {
  const healthCheckResponse = {
    status: "UP",
    checks: [
      {
        name: "DLT Adapter health check",
        status: "UP",
      },
    ],
  };
  resp.status(200).json(healthCheckResponse);
});

/**
 * @swagger
 * /api/v2/publishEvent:
 *  post:
 *    description: Publishes a DOME Event to the blockchain network set by environment variables through the node RPC Address and with the iss identifier provided. It is not mandatory to provide those two if planning to use the ones declared in the respective environment variables.
 *    tags:
 *      - DLT Adapter   
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/v1_publishEvent_body'
 *          examples:
 *            '0':
 *              value: "{\r\n    \"eventType\": \"ProductAdded\",\r\n    \"dataLocation\": \"x\",\r\n    \"relevantMetadata\": [\"sbx\", \"veryRelevant2\"],\r\n \"entityId\": \"0x626c756500000000000000000000000000000000000000000000000000000000\",\r\n \"previousEntityHash\": \"0x626c756500000000000000000000000000000000000000000000000000000000\"}"
 *    responses:
 *      '201':
 *        description: Returns the blockchain UNIX timestamp of publication of the event 
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: 1706616455
 *      '400':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: Error connecting to the blockchain node.
 *    servers:
 *      - url: http://localhost:8080
 */
router.post("/api/v2/publishEvent", (req: any, resp: any) => {
  (async () => {
    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      let eventTimestamp = await publishDOMEEvent(
        req.body.eventType,
        req.body.dataLocation,
        req.body.relevantMetadata,
        req.body.iss ?? process.env.ISS,
        req.body.entityId,
        req.body.previousEntityHash,
        req.body.rpcAddress ?? process.env.RPC_ADDRESS 
      );
      resp.status(201).json(eventTimestamp);
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

/**
 * @swagger
 * /api/v2/subscribe:
 *  post:
 *    description: Subscribes to the DOME Events of the specified type and notifies the corresponding DOME Events to the specified endpoint.
 *    tags:
 *      - DLT Adapter
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/v1_subscribe_body'
 *          examples:
 *            '0':
 *              value: "{\r\n   \"eventTypes\": [\"ProductAdded1\", \"ProductAdded2\"],\r\n  \"metadata\": [\"sbx\"],\r\n  \"notificationEndpoint\": \"http://localhost:8080/api/v1/testSubscribedUser\"\r\n}"
 *    responses:
 *      '200':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: OK.
 *      '400':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: Error connecting to the blockchain node.
 *    servers:
 *      - url: http://localhost:8080
 */
router.post("/api/v2/subscribe", (req: any, resp: any) => {
  (async () => {
    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      subscribeToDOMEEvents(
        req.body.eventTypes,
        req.body.metadata,
        process.env.RPC_ADDRESS!,
        process.env.ISS!,
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

/**
 * @swagger
 * /api/v2/subscribe:
 *  get:
 *    description: Returns all the active subscriptions
 *    tags:
 *      - DLT Adapter
 *    responses:
 *      '200':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: OK.
 *      '400':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *        schema:
 *          type: string
 *        example: Error connecting to the blockchain node.
 *    servers:
 *      - url: http://localhost:8080
 */
router.get("/api/v2/subscribe", (req: any, resp: any) => {
  (async () => {
    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      resp.status(200).send(getActiveSubscriptions());
    } catch (error: any) {

      debugLog("Error:\n ", error);
      resp.status(400).send("Error connecting to the blockchain node.");
    }
  })();
});

/**
 * @swagger
 * /api/v2/subscribe/all:
 *  post:
 *    description: Subscribe to all the DOME Events
 *    tags:
 *      - DLT Adapter
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/v2_subscribe_all_body'
 *    responses:
 *      '200':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: OK.
 *      '400':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *          text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: Error connecting to the blockchain node.
 *    servers:
 *      - url: http://localhost:8080
 */
router.post("/api/v2/subscribe/all", (req: any, resp: any) => {
  (async () => {
    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      subscribeToAllDOMEEvents(
        process.env.RPC_ADDRESS!,
        process.env.ISS!,
        req.body.notificationEndpoint
      );
      resp.status(200).send("OK");
    } catch (error: any) {
      errorLog("Error:\n", error);
      if (error == IllegalArgumentError) {
        resp.status(400).send(error.message);
      } else {
        resp.status(500).send("Error subscribing to all events.");
      }
    }
  })();
});

/**
 * @swagger
 * /api/v2/events:
 *  get:
 *    tags:
 *      - DLT Adapter
 *    parameters:
 *      - in: query
 *        name: startDate
 *        schema:
 *          type: string 
 *      - in: query
 *        name: endDate 
 *        schema:
 *          type: string 
 *      - in: query
 *        name: envM
 *        schema:
 *          type: string 
 *    responses:
 *      '200':
 *        description: Returns the DOME Events that are still active between the given dates
 *        content:
 *          application/json:
 *            examples:
 *              '0':
 *                value:  [
 *                          {
 *                              "id": 702,
 *                              "ethereumAddress": "0xeBA8507227af9e6DfB8D4575549C52457112C958",
 *                              "publisherAddress": "0x43b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c493d",
 *                              "timestamp": 1705401561000,
 *                              "eventType": "ProductOffering",
 *                              "dataLocation": "http://scorpio:9090/ngsi-ld/v1/entities/urn:ngsi-ld:product-offering:443734333?hl=0xb1331924fa7a2dc86ebedfbef5b159449cf91112b5ec4336ca8342cc71ac060e",
 *                              "relevantMetadata": [sbx],
 *                              "entityId": "0x82ca976389b8c45f0a5923c21f8d0185d0d632061a683830e687c29e8bdc91b6",
 *                              "previousEntityHash": "0x82ca976389b8c45f0a5923c21f8d0185d0d632061a683830e687c29e8bdc91b6"
 *                          },
 *                          {
 *                              "id": 689,
 *                              "ethereumAddress": "0xeBA8507227af9e6DfB8D4575549C52457112C958",
 *                              "publisherAddress": "0x43b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c493d",
 *                              "timestamp": 1705047233000,
 *                              "eventType": "ProductOffering",
 *                              "dataLocation": "http://scorpio:9090/ngsi-ld/v1/entities/urn:ngsi-ld:product-offering:443734334?hl=0xe9501808af2401bc84d387383e37bf52362017f4c8e51a702f0f0480dced8a82",
 *                              "relevantMetadata": [sbx],
 *                              "entityId": "0x65c4b136290052a864ec06978838bfcad47fc5234c467d34e372a37bc1aa91e4",
 *                              "previousEntityHash": "0x65c4b136290052a864ec06978838bfcad47fc5234c467d34e372a37bc1aa91e4"
 *                          } 
 *                        ]
 *      '400':
 *        description: Auto generated using Swagger Inspector
 *        content:
 *           text/html; charset=utf-8:
 *            schema:
 *              type: string
 *            example: Error connecting to the blockchain node.
 *    servers:
 *      - url: http://localhost:8080
 */
router.get('/api/v2/events', async (req: any, resp: any) => {
  (async() => {

    debugLog("Entry call from origin: ", req.headers.origin);
    try {
      let activeEvents = await getActiveDOMEEventsByDate(req.query.startDate, req.query.endDate, req.query.envM, process.env.RPC_ADDRESS!);
      resp.status(200).json(activeEvents);
    } catch (error: any) {
      if (error == IllegalArgumentError) {
        errorLog("Error:\n ", error);
        resp.status(400).send(error.message);
      }
      debugLog("Error:\n ", error);
      resp.status(400).send("Error connecting to the blockchain.");
    }
  })();
})
export = router;
