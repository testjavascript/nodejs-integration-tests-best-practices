const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const {
    initializeWebServer,
    stopWebServer
} = require('../../../example-application/api-under-test');
const ordersData = require('./data.json');

let expressApp;
let sinonSandbox;

beforeAll(async (done) => {
    nock("http://localhost/user/").get(`/1`).reply(200, {
        id: 1,
        name: "John",
    }).persist();

    // ️️️✅ Best Practice: Place the backend under test within the same process
    expressApp = await initializeWebServer();

    // ️️️✅ Best Practice: use a sandbox for test doubles for proper clean-up between tests
    sinonSandbox = sinon.createSandbox();

    done();
});

afterAll(async (done) => {
    // ️️️✅ Best Practice: Clean-up resources after each run
    await stopWebServer();
    done();
});

beforeEach(() => {
    if (sinonSandbox) {
        sinonSandbox.restore();
    }
});

// ️️️✅ Best Practice: Structure tests 
describe("/api", () => {
    describe("POST /orders", () => {
        test.each(ordersData)("When adding a new valid order, Then should get back 200 response111", async (orderToAdd) => {
            //Act
            const receivedAPIResponse = await request(expressApp).post("/order").send(orderToAdd);
            //Assert
            const {
                status,
            } = receivedAPIResponse;

            expect(status).toBe(200);
        });
    });
});
