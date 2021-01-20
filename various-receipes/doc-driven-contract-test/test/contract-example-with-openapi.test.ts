const request = require("supertest");
const nock = require("nock");

import * as fs from 'fs';
import * as path from 'path';

import { OpenApiValidator } from 'express-openapi-validate';
import { initializeWebServer, stopWebServer } from '../../../example-application/api-under-test';

const file = fs.readFileSync(path.join(__dirname, '../../../example-application/openapi/openapi.json'));

const opan_api = JSON.parse(file.toString());
const validator = new OpenApiValidator(opan_api, {});

let expressApp;

beforeAll(async () => {
    expressApp = await initializeWebServer();
});

afterEach(() => {
    nock.cleanAll();
})

afterAll(async () => {
    await stopWebServer();
});

describe("Verify openApi spec", () => {

    describe("POST /orders", () => {

        test("When added a valid order and 200 was expected", async () => {
            const validateResponse = validator.validateResponse("post", "/order");
            nock("http://localhost/user/").get(`/1`).reply(200, {
                id: 1,
                name: "John",
            });
            const orderToAdd = {
                userId: 1,
                productId: 2,
                mode: "approved",
            };

            const res = await request(expressApp)
                .post("/order")
                .send(orderToAdd);

            expect(validateResponse(res)).toBeUndefined();
        });

        test("When an invalid order was send and 400 was expected", async () => {
            const validateResponse = validator.validateResponse("post", "/order");
            nock("http://localhost/user/").get(`/1`).reply(200, {
                id: 1,
                name: "John",
            });
            const orderToAdd = {
                userId: 1,
                mode: "approved",
            };

            const res = await request(expressApp)
                .post("/order")
                .send(orderToAdd);

            expect(validateResponse(res)).toBeUndefined();
        });

        test("When an external call failed and 404 was expected", async () => {
            const validateResponse = validator.validateResponse("post", "/order");
            nock("http://localhost/user/").get(`/1`).reply(404);
            const orderToAdd = {
                userId: 1,
                productId: 2,
                mode: "approved",
            };

            const res = await request(expressApp)
                .post("/order")
                .send(orderToAdd);

            expect(validateResponse(res)).toBeUndefined();
        });

    });
});
