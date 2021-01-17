const request = require("supertest");
const sinon = require("sinon");
const nock = require("nock");
const {
    initializeWebServer,
    stopWebServer
} = require("../api-extension");
const authenticationMiddleware = require("../authentication-middleware");

let expressApp;

beforeAll(async (done) => {
    // ️️️✅ Best Practice: Place the backend under test within the same process
    expressApp = await initializeWebServer();

    done();
});

beforeEach(() => {
    sinon.stub(authenticationMiddleware, "authenticationMiddleware").callsFake((req, res, next) => {
        if (req.headers['authorization'] === 'special-back-door') {
            next();
        } else {
            res.status(401).end();
            return;
        }
    });

    nock("http://localhost/user/").get(`/1`).reply(200, {
        id: 1,
        name: "John",
    });
});

afterEach(() => {
      // ️️️✅ Best Practice: Clean nock interceptors and sinon test-doubles between tests
    sinon.restore();
    nock.cleanAll();
})

afterAll(async (done) => {
    // ️️️✅ Best Practice: Clean-up resources after each run
    await stopWebServer();
    done();
});

// ️️️✅ Best Practice: Structure tests 
describe("/api", () => {
    describe("POST /orders", () => {
        test("When adding a new valid order, Then should get back 200 response", async () => {

            //Arrange
            const orderToAdd = {
                userId: 1,
                productId: 2,
                mode: "approved",
            };

            //Act
            const receivedAPIResponse = await request(expressApp).post("/order").set('authorization', 'special-back-door').send(orderToAdd);

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
