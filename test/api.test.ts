const supertest = require('supertest');
const {app} = require('../src/server');
import {describe, expect, it, beforeEach} from '@jest/globals'

let api: any;

beforeEach(() => { api = supertest(app); })

describe('Express Server Tests', () => {
    it('Should respond with a 404 for an unknown route', async () => {
        const response = await api.get('/nonexistent');
        expect(response.status).toBe(404);
        expect(response.message).toBe(undefined)
        expect(response.body.message).toBe("Not Found")
    });
    it("Return HTTP 200 OK", async () => {
        const healthCheckResponse = {
            status: "UP",
            checks: [
            {
                name: "Blockchain connector health check",
                status: "UP",
            },
            ],
        };
        const response = await api.get('/health');
        expect(response.status).toEqual(200);
        expect(response.header['content-type']).toMatch(/application\/json/);
        expect(response.body).toEqual(healthCheckResponse);
    });
});


describe("POST /api/v1/configureNode", () => {

    it("Node configuration", async () => {
        const response = await configureNode()

        expect(response.status).toEqual(201);
        expect(response.header['content-type']).toMatch(/text\/html/);
        expect(response.text).toBe("OK");
    });
});

describe("POST /api/v1/subscribe", () => {

    it("Subscription to single event", async () => {
        await configureNode();
        const response = await subscribeSingleEvent();

        expect(response.status).toEqual(201);
        expect(response.header['content-type']).toMatch(/text\/html/);
        expect(response.text).toBe("OK");
    });

    it("Subscription to multiple events", async () => {
        await configureNode();
        const response = await subscribeMultipleEvents();

        expect(response.status).toEqual(201);
        expect(response.header['content-type']).toMatch(/text\/html/);
        expect(response.text).toBe("OK");
    });
});

describe("POST /api/v1/publishEvent", () => {
    it("Event publication", async () => {
        await configureNode();
        await subscribeSingleEvent();

        const requestBody = {
            eventType: 'productAdded',
            dataLocation: 'x',
            relevantMetadata: ['veryRelevant1', 'veryRelevant2'],
            entityId: "0x626c756500000000000000000000000000000000000000000000000000000001",
            previousEntityHash:"0x626c756500000000000000000000000000000000000000000000000000000000"
        };
        const response = await api
            .post('/api/v1/publishEvent')
            .set('Cookie', 'sessionCookieDOME=s%3A_GXSO6x4Px0VmIfuPyD-3NHv-QwSvu7-.1wzULfw%2BeUcZn%2FJhanyfW5R3%2BC4yQ9vO82vsqy6Abm0; Path=/; HttpOnly;')
            .withCredentials()
            .send(requestBody);
        expect(response.status).toEqual(201);
        expect(response.header['content-type']).toMatch(/text\/html/);
        expect(response.text).toBe("OK");
    }, 40000);
});

async function configureNode() {
    const response = await api
        .post('/api/v1/configureNode')
        .set('Cookie', 'sessionCookieDOME=s%3A_GXSO6x4Px0VmIfuPyD-3NHv-QwSvu7-.1wzULfw%2BeUcZn%2FJhanyfW5R3%2BC4yQ9vO82vsqy6Abm0; Path=/; HttpOnly;')
        .withCredentials()
        .send({
            "rpcAddress": "https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6",
            "iss": "0x43b27fef24cfe8a0b797ed8a36de2884f9963c0c2a0da640e3ec7ad6cd0c493d"
        });

    return response
}

async function subscribeSingleEvent() {
    const response = await api
        .post('/api/v1/subscribe')
        .set('Cookie', 'sessionCookieDOME=s%3A_GXSO6x4Px0VmIfuPyD-3NHv-QwSvu7-.1wzULfw%2BeUcZn%2FJhanyfW5R3%2BC4yQ9vO82vsqy6Abm0; Path=/; HttpOnly;')
        .withCredentials()
        .send({
            "eventTypes": ["productAdded"]
        });

    return response
}

async function subscribeMultipleEvents() {
    const response = await api
        .post('/api/v1/subscribe')
        .set('Cookie', 'sessionCookieDOME=s%3A_GXSO6x4Px0VmIfuPyD-3NHv-QwSvu7-.1wzULfw%2BeUcZn%2FJhanyfW5R3%2BC4yQ9vO82vsqy6Abm0; Path=/; HttpOnly;')
        .withCredentials()
        .send({
            "eventTypes": ["productAdded1", "productAdded2"]
        });

    return response
}


