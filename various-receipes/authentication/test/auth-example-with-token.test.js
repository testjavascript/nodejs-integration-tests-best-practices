const request = require("supertest");
const sinon = require("sinon");
const {
    initializeWebServer,
    stopWebServer
} = require("../api-extension");
const nock = require("nock");
const signTokenSynchronously = require("./helper");

let expressApp;
let sinonSandbox;
let defaultValidToken;

beforeAll(async (done) => {
    defaultValidToken = signTokenSynchronously('test-user', 'user', Math.floor(Date.now() / 1000) + (60 * 3600));

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
        test("When token expired , Then get back 401", async () => {

            //Arrange
            const orderToAdd = {
                userId: 1,
                productId: 2,
                mode: "approved",
            };
            nock("http://localhost/user/").get(`/1`).reply(200, {
                id: 1,
                name: "John",
            });
            const expiredToken = signTokenSynchronously('test-user', 'user', -1000);

            //Act
            const receivedAPIResponse = await request(expressApp).post("/order").set('authorization', expiredToken).send(orderToAdd);

            //Assert
            expect(receivedAPIResponse.status).toBe(401);
        })

        test("When adding a new valid order , Then should get back 200 response", async () => {

            //Arrange
            const orderToAdd = {
                userId: 1,
                productId: 2,
                mode: "approved",
            };
            nock("http://localhost/user/").get(`/1`).reply(200, {
                id: 1,
                name: "John",
            });

            //Act
            const receivedAPIResponse = await request(expressApp).post("/order").set('authorization', defaultValidToken).send(orderToAdd);

            //Assert
            const {
                status,
                body
            } = receivedAPIResponse;

            expect({
                status,
                body,
            }).toMatchObject({
                status: 200,
                body: {
                    mode: "approved",
                },
            });
        });
    });
});