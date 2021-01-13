![Header](./graphics/main-header.png "Component Tests")

<br/>

## Master the art of the most powerful technique for testing modern backend


<br/>

# Intro

This repo shows the immense power of narrow integration tests, also known as 'component test', including examples and how to set them up properly. This might make a dramatic impact on your testing effort and success 🚀. Warning: You might fall in love with testing 💚

![Header](/graphics/component-diagram.jpg "Component Tests")

<br/><br/><br/>

# Why is this so important

TBD - The testing world is moving from pyramids to diamonds, more emphasis is being put on integration tests and for good reasons. Here to put reasons to move toward more integration tests

<br/><br/><br/>

# What can you find here?

This repo provides the following benefits and assets:

**1. 📊  Example application -** A Complete showcase of a typical Microservice with tests setup and the test themselves

**2. ✅ 40+ Best Practices List -** Detailed instructions on how to write integartiong tests in the RIGHT way including code example and reference to the example application

**3. 🚀   Advanced stuff -** How to take this technique to the next level and maximize your invest. This includes beyond the basics techniques like store your DB data in a fast RAM folder, detect memory leaks during tests, testing data migrations, contract tests and more

<br/><br/><br/>

# 📊 Example application

In this folder you may find a complete example of real-world like application, a tiny Orders component (e.g. e-commerce ordering), including tests. We recommend skimming through this examples before or during reading the best practices. Note that we intentionally kept the app small enough to ease the reader experience. On top of it, a 'various-recipes' folder exists with additional patterns and practices - This is your next step in the learning journey


<br/><br/><br/>

# ✅ Best Practices

<br/>

## **Section: Web server setup**

<br/>

### ⚪️ 1. The test and the backend should live within the same process

🏷&nbsp; **Tags:** `#basic, #strategic`

:white_check_mark: &nbsp; **Do:** The tests should start the webserver within the same process, not in a remote environment or container. Failing to do so will result in lose of critical features: A test won't be able to simulate various important events using test doubles (e.g. make some component throw an exception), customize environment variables, and make configuration changes. Also, the complexity of measuring code coverage and intercepting network calls will highly increase

<br/>

👀 &nbsp; **Alternatives:** one might spin the backend in Docker container or just a separate Node process. This configuration better resembles the production but it will lack critical testing features as mentioned above ❌; Some teams run integration tests against production-like cloud envrionment (see bullet 'Reuse tests against production-like environment), this is a valid technique for extra validation but will get too slow and limiting to rely on during develoment ❌; 

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const apiUnderTest = require('../api/start.js');

beforeAll(async (done) => {
  //Start the backend in the same process
```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>

### ⚪️ 2. Let the tests control when the server should start and shutoff

🏷&nbsp; **Tags:** `#basic, #strategic`

:white_check_mark: &nbsp; **Do:** The server under test should let the test decide when to open the connection and when to close it. If the webserver do this alone automatically when its file is imported, then the test has no chance to perform important actions beforehand (e.g. change DB connection string). It also won't stand a chance to close the connection and avoid hanging resources. Consequently, the web server initialize code should expose two functions: start(port), stop(). By doing so, the production code has the initializtion logic and the test should control the timing

<br/>

👀 &nbsp; **Alternatives:** The web server initializtion code might return a reference to the webserver (e.g. Express app) so the tests open the connection and control it - This will require to put another identical production code that opens connections, then tests and production code will deviate a bit ❌; Alternativelly, one can avoid closing connections and wait for the process to exit - This might leave hanging resources and won't solve the need to do some actions before startup ❌

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}

beforeAll(async (done) => {
  expressApp = await initializeWebServer();
  done();
  }

afterAll(async (done) => {
  await stopWebServer();
  done();
});


```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>

### ⚪️ 3. Specify a port in production, randomize in testing

🏷&nbsp; **Tags:** `#intermediate`

:white_check_mark: &nbsp; **Do:** Let the server randomize a port in testing to prevent port collisions. Otherwise, specifying a specific port will prevent two testing processes from running at the same time. Almost every network object (e.g. Node.js http server, TCP, Nest, etc) randmoizes a port by default when no specific port is specified

<br/>

👀 &nbsp; **Alternatives:** Running a single process will slow down the tests ❌; Some parallelize the tests but instantiate a single web server, in this case the tests live in a different process and will lose many features like test doubles (see dedicated bullet above) ❌; 

<br/>


<details><summary>✏ <b>Code Examples</b></summary>

```
// api-under-test.js
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    connection = expressApp.listen(webServerPort, () => {// No port
      resolve(expressApp);
    });
  });
};

// test.js
beforeAll(async (done) => {
  expressApp = await initializeWebServer();//No port
  });


```

</details>

<br/><br/>

### ⚪️ 3. Define infrastructure in a docker-compose file

:white_check_mark:  **Do:**
All the databases, message queues and infrastructure that is being used by the app should run in a docker-compose environment. This allows easily share tests setup between developers and CI in environment that resembles a typical production. Note that the app under test should not neccesserily be part of this docker-compose and can keep on running locally - This is usually mor comfortable for developers

<br/>

👀  **Alternatives:**
Minikube, manual installation

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/9b6c9dbd19bf90cdaa3492db16f31daadb49a5f6/example-application/test/docker-compose.yml#L1
</details>

<br/><br/>

### ⚪️ 4. Start docker-compose in a global setup process

:white_check_mark:  **Do:**
In a typical multi-process test runner, the infrastructure should be started in a global setup process - Most test runners have a dedicated hook for this. Otherwise, database will get initiated in every process which is very wasteful. In a development environment, it's useful not to initialize the DB on every run - If the DB is already up, we can skip this step. See bullet about teardown which suggest stopping the DB only in CI env

<br/>

👀  **Alternatives:**
Invoke before the test command (e.g. package.json scripts) - Then tests can't control the teardown

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/global-setup.js#L11-L21
</details>

<br/><br/> 

### ⚪️ 5. Teardown the DB only in a CI environment

:white_check_mark:  **Do:**
In a typical multi-process test runner, the infrastructure should be started in a global setup process - Most test runners have a dedicated hook for this. Otherwise, database will get initiated in every process which is very wasteful. 

<br/>

👀  **Alternatives:**
Invoke before the test command (e.g. package.json scripts) - Then tests can't control the teardown

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/global-teardown.js#L6-L8
</details>

<br/><br/>

### ⚪️ 6. Run migrations only if needed

:white_check_mark:  **Do:**
As part of initializing the DB (via docker-compose) run the data migration. Since this is a time consuming operation - Run this only in CI or if an explicit environment variable was specified. To allow developers to migrate in a development environment, create a dedicated test command which includes the environment variable flag

<br/>

👀  **Alternatives:**
Migrate all the time

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/global-setup.js#L23-L26
</details>

<br/><br/>

### ⚪️ 7. Initialize the app within the beforeAll hook

:white_check_mark:  **Do:**
Within each test file, initialize the app and the webserver inside the beforeAll hook (In mocha this is called 'before'). Ensure to await for its readiness so the tests won't try to approach when the server is not ready to accept connections

<br/>

👀  **Alternatives:**
-

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/basic-tests.test.js#L14-L22
</details>

<br/><br/>

### ⚪️ 7. Teardown the app within the afterAll hook

:white_check_mark:  **Do:**
Within each test file, close the app and the webserver inside the afterAll hook (In mocha this is called 'after')

<br/>

👀  **Alternatives:**
-

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/basic-tests.test.js#L24-L28
</details>

<br/><br/>

### ⚪️ 8. Isolate the component from the world using HTTP interceptor

:white_check_mark:  **Do:**
Intercept all calls to extraneous services and provide a default sensible result. Use the library nock for this matter. Consider raising an exception anytime an unknown HTTP call was made. If a specific request affects the test result, the interception of this call must be defined within the test so the reader will be able to easily grasp the cause and effect

<br/>

👀  **Alternatives:**
- 

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/basic-tests.test.js#L24-L28
</details>

<br/><br/>

## **Section: Database and infrastructure setup**

<br/>

### ⚪️ 1. Place a start and stop method within your app entry point

:white_check_mark: **Do:**
For proper startup and teardown, the app entry point (e.g. webserver start code) must expose for the testing a start and stop methods that will initialize and teardown all resources. The tests will use these methods to initialize the app (e.g. API, MQ) and clean-up when done

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources then with frequent testing many connections will leak and might choke the machine

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}
```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>

## **Section: Basic Principles

<br/>

### ⚪️ 1. Test should not be longer than 5-10 statements

:white_check_mark: **Do:**
For proper startup and teardown, the app entry point (e.g. webserver start code) must expose for the testing a start and stop methods that will initialize and teardown all resources. The tests will use these methods to initialize the app (e.g. API, MQ) and clean-up when done

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources then with frequent testing many connections will leak and might choke the machine

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}
```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>

## **Section: Test Isolation

<br/>

### ⚪️ 1. Test should not be longer than 5-10 statements

:white_check_mark: **Do:**
For proper startup and teardown, the app entry point (e.g. webserver start code) must expose for the testing a start and stop methods that will initialize and teardown all resources. The tests will use these methods to initialize the app (e.g. API, MQ) and clean-up when done

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources then with frequent testing many connections will leak and might choke the machine

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}
```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>

## **Section: Dealing With Data

<br/>

### ⚪️ 1. Test should not be longer than 5-10 statements

:white_check_mark: **Do:**
For proper startup and teardown, the app entry point (e.g. webserver start code) must expose for the testing a start and stop methods that will initialize and teardown all resources. The tests will use these methods to initialize the app (e.g. API, MQ) and clean-up when done

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources then with frequent testing many connections will leak and might choke the machine

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}
```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>

## **Section: Error And Failure Handling

<br/>

### ⚪️ 1. Test should not be longer than 5-10 statements

:white_check_mark: **Do:**
For proper startup and teardown, the app entry point (e.g. webserver start code) must expose for the testing a start and stop methods that will initialize and teardown all resources. The tests will use these methods to initialize the app (e.g. API, MQ) and clean-up when done

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources then with frequent testing many connections will leak and might choke the machine

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}
```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>

## **Section: Testing Our Contracts With Others

<br/>

### ⚪️ 1. Test should not be longer than 5-10 statements

:white_check_mark: **Do:**
For proper startup and teardown, the app entry point (e.g. webserver start code) must expose for the testing a start and stop methods that will initialize and teardown all resources. The tests will use these methods to initialize the app (e.g. API, MQ) and clean-up when done

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources then with frequent testing many connections will leak and might choke the machine

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
const initializeWebServer = async (customMiddleware) => {
  return new Promise((resolve, reject) => {
    // A typical Express setup
    expressApp = express();
    defineRoutes(expressApp);
    connection = expressApp.listen(() => {
      resolve(expressApp);
    });
  });
}

const stopWebServer = async () => {
  return new Promise((resolve, reject) => {
    connection.close(() => {
      resolve();
    })
  });
}
```

➡️ [Full code here](https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34
)
  

</details>

<br/><br/>


# Advanced techniques and reference to all features

<br/><br/><br/>
****
# Reference: List of techniques and features

This repo contains examples for writing Node.js backend tests in THE RIGHT WAY including:

- Tests against API
- Isolating 3rd party services
- Stubbing the backend behavior to simulate corner cases
- Database setup with speedy RAM folder that supports both Linux, Mac & Windows
- Local env setup for speedy and convenient tests
- Documentation based contract tests (validating Swagger correctness)
- Consumer-driven contract tests (with PACT)
- Authentication/Login
- Tests with message queues
- Schema migration and seeding
- Data seeding
- Data cleanup
- Error handling tests
- Testing for proper logging and metrics
- Debug configuration and other dev tooling
- Frameworks examples: Serverless, Nest, Fastify, Koa

# How to start learning quickly and conveniently?

Just do:

- npm i
- npm run test:dev
- Open the file ./src/tests/basic-tests.test
- Follow the code and best practices inside
- Move to more advanced use cases in ./src/tests/
```
