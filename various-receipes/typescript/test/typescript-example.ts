import * as express from "express";

import { initializeWebServer, stopWebServer } from "../../../example-application/api-under-test";

let expressApp: express.Application;

beforeAll(async () => {
  expressApp = await initializeWebServer();
});

afterAll(async () => {
  await stopWebServer();
});

describe("typescript", () => {

    test("should be able to compile and run", () => {
      expect(true).toBeTruthy();
    });

});
