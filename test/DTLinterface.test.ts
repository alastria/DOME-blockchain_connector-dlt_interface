const { app, server, session } = require('../src/server');
const supertest = require('supertest');

const api = supertest(app);

describe("Check /api/v1/check", () => {
    test("Return HTTP 200 OK", async () => {
        await api.get('/api/v1/check').expect(200).expect("Content-Type", /text\/html/).expect("OK");
    })
});

describe("POST /api/v1/configureNode", () => {
    test("Node configuration", async () => {
        await api
            .post('/api/v1/configureNode')
            .set('Cookie', 'sessionCookieDOME=s%3AQwxoPWOFYQVp4bYGyz4CDjj8AcU67_w3.yLBgEFEVhz3WOy3NdW8whyvC58Xd0DDyTDLhCXwAOps')
            .send({
                "rpcAddress": "https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6",
                "userEthereumAddress": "0xb794f5ea0ba39494ce839613fffba74279579268"
            }).expect(200).expect("Content-Type", /text\/html/).expect("OK");
    })
})

describe("POST /api/v1/subscribe", () => {
    test("Subscription to single event", async () => {
        await api
            .post('/api/v1/subscribe')
            .set('Cookie', 'sessionCookieDOME=s%3AntbYjieEjPRCRVewzIh40jh7PsQB0Xq3.2lLDvA6TJfmVp3%2FIMs%2BAynUyNhdaBOBhyn8LO0IATJk')
            .send({
                "eventType":  ["productAdded"],
                "notificationEndpoint": "http://localhost:8080/api/v1/testSubscribedUser"
            }).expect(200).expect("Content-Type", /text\/html/).expect("OK");
    })
    test("Subscription to multiple events", async () => {
        await api
            .post('/api/v1/subscribe')
            .set('Cookie', 'sessionCookieDOME=s%3AntbYjieEjPRCRVewzIh40jh7PsQB0Xq3.2lLDvA6TJfmVp3%2FIMs%2BAynUyNhdaBOBhyn8LO0IATJk')
            .send({
                "eventType":  ["productAdded", "productAdded2"],
                "notificationEndpoint": "http://localhost:8080/api/v1/testSubscribedUser"
            }).expect(200).expect("Content-Type", /text\/html/).expect("OK");
    })
})


describe("POST /api/v1/publishEvent", () => {
    it('should configure session correctly', async () => {
        //Create object req simulate 
        const req = {
          session: {},
        } as typeof session;
    
        
        const rpcAddress = 'https://red-t.alastria.io/v0/9461d9f4292b41230527d57ee90652a6';
        const userEthereumAddress = '0xb794f5ea0ba39494ce839613fffba74279579268';
        await api
            .post('/api/v1/publishEvent')
            .set('Cookie', 'sessionCookieDOME=s%3AQwxoPWOFYQVp4bYGyz4CDjj8AcU67_w3.yLBgEFEVhz3WOy3NdW8whyvC58Xd0DDyTDLhCXwAOps')
            .send({
                "eventType": "productAdded",
                "dataLocation": "x",
                "relevantMetadata": ["veryRelevant1", "veryRelevant2"]
            }).expect(200)
    
        // Verifica que la sesión se haya configurado correctamente
        expect(req.session.provider).toBeDefined();
        expect(req.session.userEthereumAddress).toBe(userEthereumAddress);
        expect(req.session.rpcAddress).toBe(rpcAddress);


      });
    // test("Event publication", async () => {
    //     await api
    //         .post('/api/v1/publishEvent')
    //         .set('Cookie', 'sessionCookieDOME=s%3AQwxoPWOFYQVp4bYGyz4CDjj8AcU67_w3.yLBgEFEVhz3WOy3NdW8whyvC58Xd0DDyTDLhCXwAOps')
    //         .send({
    //             "eventType": "productAdded",
    //             "dataLocation": "x",
    //             "relevantMetadata": ["veryRelevant1", "veryRelevant2"]
    //         }).expect(200).expect("Content-Type", /text\/html/).expect("OK");
    // }, 100000000000)
}

)



//Close server connection
afterAll(done => {
    server.close();
    done();
});