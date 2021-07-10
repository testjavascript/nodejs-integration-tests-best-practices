const axios = require('axios');
const {
    initializeWebServer,
    stopWebServer
} = require("../api-extension");
const nock = require("nock");
const {
    signTokenSynchronously,
    signExpiredTokenSynchronously
} = require("./helper");

let axiosAPIClient, defaultValidToken;

beforeAll(async (done) => {
    defaultValidToken = signTokenSynchronously('test-user', 'user');

    // ️️️✅ Best Practice: Place the backend under test within the same process
    const apiConnection = await initializeWebServer();
    const axiosConfig = {
      baseURL: `http://127.0.0.1:${apiConnection.port}`,
      validateStatus: () => true, //Don't throw HTTP exceptions. Delegate to the tests to decide which error is acceptable
    };
    axiosAPIClient = axios.create(axiosConfig);

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
            const { status } = await axiosAPIClient.post("/order", orderToAdd, {
              headers: {
                authorization: expiredToken,
              }
            });

            //Assert
            expect(status).toBe(401);
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
            const { status, data } = await axiosAPIClient.post("/order", orderToAdd, {
              headers: {
                authorization: defaultValidToken,
              }
            });

            //Assert
            expect({
                status,
                data,
            }).toMatchObject({
                status: 200,
                data: {
                    mode: "approved",
                },
            });
        });
    });
});