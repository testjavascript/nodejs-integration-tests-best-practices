import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import colors from 'colors/safe';
import * as dateFns from 'date-fns';
import { AddressInfo } from 'net';
import nock from 'nock';
import * as sinon from 'sinon';

import { startWebServer, stopWebServer } from '../../entry-points/api';
import { Roles, User } from '../../libraries/types';
const jwt = require('jsonwebtoken');

export type TestStartOptions = {
  startAPI: boolean;
  disableNetConnect: boolean;
  includeTokenInHttpClient: boolean;
  mockGetUserCalls: boolean;
  mockMailerCalls: boolean;
};

let apiAddress: null | AddressInfo; // holds the address of the API server to bake into HTTP clients
let httpClientForArrange: AxiosInstance | undefined; // This is used for making API calls in the arrange phase, where we wish to fail fast if someting goes wrong happen
let httpClient: AxiosInstance | undefined; // Http client for the Act phase, won't throw errors but rather return statuses
let chosenOptions: TestStartOptions | undefined;

export const testSetup = {
  start: async function (options: TestStartOptions) {
    console.log('testSetup.start');
    chosenOptions = options;
    if (options.startAPI === true) {
      console.log('testSetup.start.startWebServer');
      apiAddress = await startWebServer();
      console.log('testSetup.start.apiAddress', apiAddress);
    }
    if (options.disableNetConnect === true) {
      disableNetworkConnect();
    }
    nock.emitter.on('no match', (request) => {
      if (
        request.host?.includes('localhost') ||
        request.host?.includes('127.0.0.1')
      ) {
        return;
      }
      console.log(
        colors.red(
          `An unmocked HTTP call was found. This is not recommended as it hurts performance, stability and also might get blocked: ${request.method} ${request.protocol}://${request.host}${request.path}`,
        ),
      );
    });
  },

  tearDownTestFile: async function () {
    if (apiAddress) {
      await stopWebServer();
    }
    apiAddress = null;
    nock.cleanAll();
    nock.enableNetConnect();
    sinon.restore();
  },

  resetBeforeEach: async function () {
    nock.cleanAll();
    sinon.restore();
    if (chosenOptions?.mockGetUserCalls === true) {
      nock('http://localhost')
        .get('/user/1')
        .reply(200, { id: '1', name: 'John' })
        .persist();
    }
    if (chosenOptions?.mockMailerCalls === true) {
      nock('http://mailer.com').post('/send').reply(202);
    }
  },

  getHTTPClienForArrange: function (): AxiosInstance {
    if (!httpClientForArrange) {
      httpClientForArrange = buildHttpClient(true);
    }

    return httpClientForArrange!;
  },

  getHTTPClient: function (): AxiosInstance {
    if (!httpClient) {
      httpClient = buildHttpClient(false);
    }
    return httpClient!;
  },
  removeUserNock: function () {
    nock.removeInterceptor({
      hostname: 'localhost',
      method: 'GET',
      path: '/user/1',
    });
  },
  removeMailNock: function () {
    nock.removeInterceptor({
      hostname: 'mailer.com',
      method: 'POST',
      path: '/send',
    });
  },
};

function buildHttpClient(throwsIfErrorStatus: boolean = false) {
  if (!apiAddress) {
    // This is probably a faulty state - someone instantiated the setup file without starting the API
    console.log(
      colors.red(
        `Test warning: The http client will be returned without a base address, is this what you meant?
                  If you mean to test the API, ensure to pass {startAPI: true} to the setupTestFile function`,
      ),
    );
  }

  const axiosConfig: AxiosRequestConfig = {
    maxRedirects: 0,
  };
  axiosConfig.headers = new axios.AxiosHeaders();
  axiosConfig.headers.set('Content-Type', 'application/json');
  if (apiAddress) {
    axiosConfig.baseURL = `http://127.0.0.1:${apiAddress.port}`;
  }
  if (!throwsIfErrorStatus) {
    axiosConfig.validateStatus = () => true;
  }
  if (chosenOptions?.includeTokenInHttpClient) {
    axiosConfig.headers.set(
      'Authorization',
      `${signToken(
        { id: '1', name: 'John' },
        Roles.user,
        dateFns.addDays(new Date(), 1).getTime(),
      )}`,
    );
  }

  const axiosInstance = axios.create(axiosConfig);

  return axiosInstance;
}

function getWebServerAddress() {
  if (!apiAddress) {
    throw new Error('The API server is not started, cannot get its address');
  }
  return { port: apiAddress.port, url: apiAddress.address };
}

function disableNetworkConnect() {
  nock.disableNetConnect();
  nock.enableNetConnect(
    (host) => host.includes('127.0.0.1') || host.includes('localhost'),
  );
}

function signToken(user: User, role: Roles, expirationInUnixTime: number) {
  const token = jwt.sign(
    {
      exp: expirationInUnixTime,
      data: {
        user,
        role,
      },
    },
    'some secret', // In production system obviously read this from config...
  );

  return token;
}
