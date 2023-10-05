const { app, server } = require('../src/server');
const supertest = require('supertest');
let api: any; 

beforeEach(()=> { api = supertest(app);})

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
        let resp = await configureNode();
        const cookies = resp.headers['set-cookie'];
        const cookie = cookies[0].match(/%3A(.*);\sPath/)[1];
        // await subscribeSingleEvent(cookie);

        const requestBody = {
            eventType: 'productAdded',
            dataLocation: 'x',
            relevantMetadata: ['veryRelevant1', 'veryRelevant2'],
        };
        const response = await api
            .post('/api/v1/publishEvent')
            .set('Cookie', 'sessionCookieDOME=s%3AQwxoPWOFYQVp4bYGyz4CDjj8AcU67_w3.yLBgEFEVhz3WOy3NdW8whyvC58Xd0DDyTDLhCXwAOps')
            .send(requestBody);
        expect(response.status).toEqual(201);
        expect(response.header['content-type']).toMatch(/text\/html/);
        expect(response.text).toBe("OK");
    });
});

async function configureNode(){
        const response = await api
            .post('/api/v1/configureNode')
            .set('Cookie', 'sessionCookieDOME=QwxoPWOFYQVp4bYGyz4CDjj8AcU67_w3.yLBgEFEVhz3WOy3NdW8whyvC58Xd0DDyTDLhCXwAOps')
            .withCredentials()
            .send({
                "rpcAddress": "https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6",
                "userEthereumAddress": "0xb794f5ea0ba39494ce839613fffba74279579268"
            });
            console.log(response.headers['set-cookie'])

        return response
}

async function subscribeSingleEvent(){
        const response = await api
            .post('/api/v1/subscribe')
            .set('Cookie', 'sessionCookieDOME=s%3AntbYjieEjPRCRVewzIh40jh7PsQB0Xq3.2lLDvA6TJfmVp3%2FIMs%2BAynUyNhdaBOBhyn8LO0IATJk')
            .send({
                "eventType": ["productAdded"],
                "notificationEndpoint": "http://localhost:8080/api/v1/testSubscribedUser"
            });

        return response
}

async function subscribeMultipleEvents(){
        const response = await api
            .post('/api/v1/subscribe')
            .set('Cookie', 'sessionCookieDOME=s%3AntbYjieEjPRCRVewzIh40jh7PsQB0Xq3.2lLDvA6TJfmVp3%2FIMs%2BAynUyNhdaBOBhyn8LO0IATJk')
            .send({
                "eventType": ["productAdded1", "productAdded2"],
                "notificationEndpoint": "http://localhost:8080/api/v1/testSubscribedUser"
            });

        return response
}


