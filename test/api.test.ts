const supertest = require('supertest');
const { app, server } = require('../src/server');
let api: any;

// 
beforeEach(() => { api = supertest(app); })

// Close the server after all tests have completed
afterEach((done) => {
    server.close(() => {
        done();
    });
});


describe('Express Server Tests', () => {
    it('Should respond with a 404 for an unknown route', async () => {
        const response = await api.get('/nonexistent');
        expect(response.status).toBe(404);
        expect(response.message).toBe(undefined)
        expect(response.body.message).toBe("not found")
    });

    it('Should respond with "OK" message', async () => {
        const response = await api.get('/');
        expect(response.status).toBe(200);
        expect(response.text).toBe("OK")
    });
});



describe("GET /api/v1/check", () => {
    it("Return HTTP 200 OK", async () => {
        const response = await api.get('/api/v1/check');
        expect(response.status).toEqual(200);
        expect(response.header['content-type']).toMatch(/text\/html/);
        expect(response.text).toBe("OK");
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
            "userEthereumAddress": "0xb794f5ea0ba39494ce839613fffba74279579268"
        });
    console.log(response.headers['set-cookie'])

    return response
}

async function subscribeSingleEvent() {
    const response = await api
        .post('/api/v1/subscribe')
        .set('Cookie', 'sessionCookieDOME=s%3A_GXSO6x4Px0VmIfuPyD-3NHv-QwSvu7-.1wzULfw%2BeUcZn%2FJhanyfW5R3%2BC4yQ9vO82vsqy6Abm0; Path=/; HttpOnly;')
        .withCredentials()
        .send({
            "eventType": ["productAdded"],
            "notificationEndpoint": "http://localhost:8080/api/v1/testSubscribedUser"
        });

    return response
}

async function subscribeMultipleEvents() {
    const response = await api
        .post('/api/v1/subscribe')
        .set('Cookie', 'sessionCookieDOME=s%3A_GXSO6x4Px0VmIfuPyD-3NHv-QwSvu7-.1wzULfw%2BeUcZn%2FJhanyfW5R3%2BC4yQ9vO82vsqy6Abm0; Path=/; HttpOnly;')
        .withCredentials()
        .send({
            "eventType": ["productAdded1", "productAdded2"],
            "notificationEndpoint": "http://localhost:8080/api/v1/testSubscribedUser"
        });

    return response
}


