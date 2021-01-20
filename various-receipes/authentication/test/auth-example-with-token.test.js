const request = require("supertest");
const {
    initializeWebServer,
    stopWebServer
} = require("../api-extension");
const nock = require("nock");
const {
    signTokenSynchronously,
    signExpiredTokenSynchronously
} = require("./helper");

let expressApp;
let defaultValidToken;

beforeAll(async (done) => {
    defaultValidToken = signTokenSynchronously('test-user', 'user');

    // ️️️✅ Best Practice: Place the backend under test within the same process
    expressApp = await initializeWebServer();

    done();
});

afterAll(async (done) => {
    // ️️️✅ Best Practice: Clean-up resources after each run
    await stopWebServer();
    done();
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
            const expiredToken = signExpiredTokenSynchronously('test-user', 'user');

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