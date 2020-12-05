const request = require("supertest");
const sinon = require("sinon");
const { initializeWebServer, stopWebServer } = require("../../../../example-application/api-under-test");
const { PubSub, Subscription } = require("@google-cloud/pubsub");

let expressApp;
let sinonSandbox;

beforeAll(async (done) => {
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
    jest.setTimeout(30000);
    if (sinonSandbox) {
        sinonSandbox.restore();
    }
});

// ️️️✅ Best Practice: Structure tests
describe("pubsub", () => {
    describe("/api", () => {
        describe("POST /emit", () => {
            test("When emitting a message using pubsub message queue, then should receive message", async () => {
                //Arrange
                const topicName = 'test-topic';
                const subscriptionName = 'test-subscription';

                const messageToSend = {
                    message: {
                        hello: "World"
                    }
                };

                //Mock repsponse message
                const mockedMessage = {
                    ackId: 'projects/mq-tests/subscriptions/test-subscription:1',
                    attributes: {},
                    data: Buffer.from(JSON.stringify(messageToSend)),
                    deliveryAttempt: 0,
                    id: '1',
                    orderingKey: '',
                    publishTime: new Date('2020-12-02T21:34:58.000Z'),
                    received: 1606944898908,
                    ack: sinonSandbox.stub(),
                };

                //Stub Subscription events
                const stubOn = sinonSandbox.stub(Subscription.prototype, 'on');

                //Pubsub object for stubing used functions
                const pubsubMock = {};
                pubsubMock.subscription = {
                    //This line stubs the 'on message' event
                    on: stubOn.onCall(0).callsArgWith(1, mockedMessage),
                    name: subscriptionName,
                    get: () => [pubsubMock.subscription],
                };
                pubsubMock.topic = {
                    name: topicName,
                    get: () => [pubsubMock.topic],
                    subscription: sinonSandbox.stub().returns(pubsubMock.subscription),
                    publishJSON: sinonSandbox.stub(),
                };

                sinonSandbox
                    .stub(PubSub.prototype, 'subscription')
                    .returns(pubsubMock.subscription);
                sinonSandbox
                    .stub(PubSub.prototype, 'topic')
                    .withArgs(topicName)
                    .returns(pubsubMock.topic);

                //Act
                await request(expressApp).post("/pubsub/emit").send(messageToSend);
                const { body } = await request(expressApp).get("/pubsub/messages");

                //Assert
                expect(body).toMatchObject([messageToSend]);
            });
        });
    });
});
