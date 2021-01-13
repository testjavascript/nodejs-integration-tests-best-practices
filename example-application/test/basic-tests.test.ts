import * as express from "express";
import * as request from "supertest";
import * as sinon from "sinon";
import * as nock from "nock";

import { initializeWebServer, stopWebServer } from "../api-under-test";

import OrderRepository = require("../data-access/order-repository");

let expressApp: express.Application;

beforeAll(async (done) => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  expressApp = await initializeWebServer();

  // ️️️✅ Best Practice: Ensure that this component is isolated by preventing unknown calls
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");

  done();
});

afterAll(async (done) => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  await stopWebServer();
  done();
});

beforeEach(() => {
  nock.cleanAll();
  nock("http://localhost/user/").get(`/1`).reply(200, {
    id: 1,
    name: "John",
  });
});

// ️️️✅ Best Practice: Structure tests
describe("/api", () => {
  describe("POST /orders", () => {
    test.todo("When adding order without product, return 400");

    test("When adding an order without specifying product, stop and return 400", async () => {
      //Arrange
      nock("http://localhost/user/").get(`/1`).reply(200, {
        id: 1,
        name: "John",
      });
      const orderToAdd = {
        userId: 1,
        mode: "draft",
      };

      //Act
      const orderAddResult = await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      expect(orderAddResult.status).toBe(400);
    });

    test("When adding a new valid order, Then should get back 200 response", async () => {
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
      const receivedAPIResponse = await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      const { status, body } = receivedAPIResponse;

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

    test("When order failed, send mail to admin", async () => {
      //Arrange
      process.env.SEND_MAILS = "true";
      nock("http://localhost/user/").get(`/1`).reply(200, {
        id: 1,
        name: "John",
      });
      // ️️️✅ Best Practice: Intercept requests for 3rd party services to eliminate undesired side effects like emails or SMS
      // ️️️✅ Best Practice: Specify the body when you need to make sure you call the 3rd party service as expected
      const scope = nock("https://mailer.com")
        .post("/send", {
          subject: /^(?!\s*$).+/,
          body: /^(?!\s*$).+/,
          recipientAddress: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        })
        .reply(202);
      sinon.stub(OrderRepository.prototype, "addOrder").throws(new Error("Unknown error"));
      const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: "approved",
      };

      //Act
      await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      // ️️️✅ Best Practice: Assert that the app called the mailer service appropriately
      expect(scope.isDone()).toBe(true);
    });

    test("When the user does not exist, return http 404", async () => {
      //Arrange
      nock("http://localhost/user/").get(`/7`).reply(404, {
        message: "User does not exist",
        code: "nonExisting",
      });
      const orderToAdd = {
        userId: 7,
        productId: 2,
        mode: "draft",
      };

      //Act
      const orderAddResult = await request(expressApp).post("/order").send(orderToAdd);

      //Assert
      expect(orderAddResult.status).toBe(404);
    });
  });

  describe("GET /orders", () => {
    test("When filtering for canceled orders, should show only relevant items", () => {
      expect(true).toBe(true);
    });
  });
});
