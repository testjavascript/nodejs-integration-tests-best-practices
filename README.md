![Header](./graphics/main-header.png "Component Tests")

<br/>

## Master the art of the most powerful technique for testing modern backend


<br/>

# Intro

🚦Seat belt on, deep breath. Strategic backend content lies in front of you. Better block sometimes to walk-through.

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


# 6 min explainer video

https://user-images.githubusercontent.com/8571500/124645598-4a6f3a80-de9c-11eb-9d17-725a6f9b57a7.mp4


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
➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/basic-tests.test.js#L11)

</details>

<br/><br/>

### ⚪️ 4. One more thing here

🏷&nbsp; **Tags:** `#intermediate, #draft`

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
➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/basic-tests.test.js#L11)

</details>

<br/><br/>


## **Section: Database setup**

<br/>

### ⚪️ 1. Use Docker-Compose to host the database and other infrastructure

🏷&nbsp; **Tags:** `#strategic`

:white_check_mark: &nbsp; **Do:** All the databases, message queues and infrastructure that is being used by the app should run in a docker-compose environment for testing purposes. Only this technology check all these boxes: A mature and popular technology that can be reused among developer machines and CI. One setup, same files, run everywhere. Sweet value but one remarkable caveat - It's different from the production runtime platform. Things like memory limits, deployment pipeline, graceful shutdown and a-like act differently in other environments - Make sure to test those using pre-production tests over the real environment. Note that the app under test should not neccesserily be part of this docker-compose and can keep on running locally - This is usually more comfortable for developers.


<br/>

👀 &nbsp; **Alternatives:** A popular option is manual installation of local database - This results in developers working hard to get in-sync with each other ("Did you set the right permissions in the DB?") and configuring a different setup in CI ❌; Some use local Kuberentes or Serverless emulators which act almost like the real-thing, sounds promising but it won't work over most CIs vendors and usually more complex to setup in developers machine❌;  

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```yaml
  # docker-compose.yml
  version: '3.6'
  services:
    database:
      image: postgres:11
      command: postgres -c fsync=off -c synchronous_commit=off -c full_page_writes=off -c random_page_cost=1.0
      environment:
        - POSTGRES_USER=myuser
        - POSTGRES_PASSWORD=myuserpassword
        - POSTGRES_DB=shop
      container_name: 'postgres-for-testing'
      ports:
        - '54310:5432'
      tmpfs: /var/lib/postgresql/data
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/master/example-application/test/docker-compose.yml)
  
</details>

<br/><br/>

### ⚪️ 2. Start docker-compose using code in the global setup process

🏷&nbsp; **Tags:** `#strategic`

:white_check_mark:  **Do:** In a typical multi-process test runner (e.g. Mocha, Jest), the infrastructure should be started in a global setup/hook ([Jest global setup](https://jestjs.io/docs/en/configuration#globalsetup-string)), [Mocha global fixture](https://mochajs.org/#global-setup-fixtures) using custom code that spin up the docker-compose file. This takes away common workflows pains - The DB is an explicit dependency of the test, no more tests failing because the DB is down. A new developer onboarded? Get him up to speed with nothing more than ```git clone && npm test```. Everything happens automatically, no tedious README.md, no developers wonder what setup steps did they miss. In addition, going with this approach maximizes the test performance: the DB is not instantiated per process or per file, rather once and only once. On the global teardown phase, all the containers should shutoff (See a dedicated bullet below) 

<br/>


👀 &nbsp; **Alternatives:** A popular option is manual installation of local database - This results in developers working hard to get in-sync with each other ("Did you set the right permissions in the DB?") and configuring a different setup in CI ❌; Some use local Kuberentes or Serverless emulators which act almost like the real-thing, sounds promising but it won't work over most CIs vendors and usually more complex to setup in developers machine❌;  

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
  // jest.config.js
  globalSetup: './example-application/test/global-setup.js'

  // global-setup.js
  const dockerCompose = require('docker-compose');

  module.exports = async () => {
    ...
    await dockerCompose.upAll({
      cwd: path.join(__dirname),
      log: true,
    });

    await dockerCompose.exec(
      'database',
      ['sh', '-c', 'until pg_isready ; do sleep 1; done'],
      { cwd: path.join(__dirname) }
    );
    ...
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/master/example-application/test/global-setup.js#L14-L25)
  

</details>

<br/><br/>


### ⚪️ 3. Shutoff the infrastructure only in the CI environment

🏷&nbsp; **Tags:** `#performance`

:white_check_mark:  **Do:** Keep the database and other infrastructure always alive in developers' machine so the next tests run will start at a glance, typically in 3-5ms. This super-fast start-up will encourage developers to run the tests continously and treat them as a coding companion: It's an amazing coding experience to have the tests running all the time and watching your back as you type. Keeping the DB alive requires a clear data clean-up strategy, see our recommendation below. What about CI environment? This careful tune-up is mostly important in a developer machine where the test might get executed very frequently (e.g. after every editor save, once a minute), in a CI environement the next tests execution might happen in a different machine and there is no motivation to keep the the docker-compose up.

<br/>


👀 &nbsp; **Alternatives:** Should you teardown the docker-compose and restart in every tests execution, the startup time is likely to be 20x slower and is likely to kill this continous-testing experience ❌;   

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
  // jest.config.js
  globalTeardown: './example-application/test/global-teardown.js',

  // global-teardown.js - clean-up after all tests
  const isCI = require('is-ci');
  const dockerCompose = require('docker-compose');

  module.exports = async () => {
    // Check if running CI environment
    if (isCI) {
      dockerCompose.down();
    }
  }
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/master/example-application/test/global-teardown.js#L5-L8)
  

</details>

<br/><br/>

### ⚪️ 4. Optimize your real DB for testing, Don't fake it

🏷&nbsp; **Tags:** `#performance, #draft, #Michael`

:white_check_mark:  **Do:** Use the same DB product that is being used in production and configure it for faster execution. Typically, DBs accept flags that allow to reduce the storage reliability and increase speed. With just a few configuration flags ~20% performance gain is achived and hundrands tests can be run in a few seconds. You can do this by turn off the DB durability settings in postgres or run in-memory in MySQL. Using so close setup as production will make your test reliable.
<br/>

👀 &nbsp; **Alternatives:** 
* Use SQLite which is actually slower and not the same as production ❌;  no optimizations.
* Fake/Mock the DB brings noise and impair the completeness of the tests by excluding the DB from the test ❌



<br/>

<details><summary>✏ <b>Code Examples</b></summary>

#### Postgres
```
//docker-compose file
version: "3.6"
services:
  db:
    image: postgres:13
    container_name: 'postgres-for-testing'
    command: postgres -c fsync=off -c synchronous_commit=off -c full_page_writes=off -c random_page_cost=1.0
    tmpfs: /var/lib/postgresql/data
    ...
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 5. Store test data in RAM folder

🏷&nbsp; **Tags:** `#performance, #draft`

:white_check_mark:  **Do:** Minor boost, harder in Mac, easier in Linux using tmpfs, some DB has a built-in memory engine which you may consider because ([benchmark](https://github.com/testjavascript/nodejs-integration-tests-best-practices/issues/9#issuecomment-710674437))

<br/>

👀 &nbsp; **Alternatives:** Use SQLite which is actually slower ❌;  no optimizations

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```
//docker-compose file
version: "3.6"
services:
  db:
    image: postgres:13
    container_name: 'postgres-for-testing'
    tmpfs: /var/lib/postgresql/data
    ...
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)

</details>

<br/><br/>

### ⚪️ 6. Build the DB schema using migrations, ensure it happens only once in dev

🏷&nbsp; **Tags:** `#performance`

:white_check_mark:  **Do:** While there are various way to create the DB tables, always prefer the technique that is used in production - probably migrations. By doing so, another layer of bugs are covered: Should there be an issue with the DB schema - It will get caught during testing. Performance is always a critical concern, withoug thoughtful setup every tests execution will start with the migration framework approaching the DB to check if updates are needed. Alternativelly, run the migrations only if a specific environmen flag was passed. This will result in tests failing when the DB should get updated, developers must manually run npm script for migration but will maximize the tests start time. Note that migration is the right tool for building the schema and potentially also some metadata - But not the tests data itself (See bullet: Each tests must act on its own data)

<br/>

👀 &nbsp; **Alternatives:** Most ORMs provide a 'sync' method that build the DB by the code model - This technique is not recommended for production and using it only for testing will bypass issues that exist in the production technique (e.g. migrations) ❌;  Some migration frameworks (e.g. [umzug which is also used by Sequelize](https://github.com/sequelize/umzug)) allow checking for newer version by looking at local files which is way faster, this is a viable option but not applicable in many ORMs ✅; You may store locally the last migration check and execute the migration command only if the migration folder changed since then ✅;

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
  // jest.config.js
  globalSetup: './example-application/test/global-setup.js'

  // global-setup.js
  const npm = require('npm');
  const util = require('util');

  module.exports = async () => {
    ...
    const npmCommandAsPromise = util.promisify(npm.commands.run);
    await npmCommandAsPromise(['db:migrate']); // Migrating the DB using a npm script before running any tests.
    ...
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/master/example-application/test/global-setup.js#L29-L30)

</details>

<br/><br/>


## **Section: Isolating from the external world**

<br/>

### ⚪️ 1.  Isolate the component from the world using HTTP interceptor

🏷&nbsp; **Tags:** `#strategic #basic`

:white_check_mark:  **Do:** Isolate the component under test by intercepting any outgoing HTTP request and providing the desired response so the collaborator HTTP API won't get hit. Nock is a great tool for this mission as it provides a convenient syntax for defining external services behavior. Isolation is a must to prevent noise and slow performance but mostly to simulate various scenarios and responses - A good flight simulator is not about painting clear blue sky rather bringing safe storms and chaos. This is reinforced in a Microservice architecture where the focus should always be on a single component without involving the rest of the world. Though it's possible to simulate external service behavior using test doubles (mocking), it's preferable not to touch the deployed code and act on the network level to keep the tests pure black-box. The downside of isolation is not detecting when the collaborator component changes and not realizing misunderstandings between the two services - Make sure to compensate for this using a few contract or E2E tests

<br/>

👀 &nbsp; **Alternatives:** Some services provide a fake version that can be deployed by the caller locally, usually using Docker - This will ease the setup and boost the performance but won't help with simulating various responses &nbsp; ❌; Some services provide 'sandbox' environment, so the real service is hit but no costs or side effects are triggered - This will cut down the noise of setting up the 3rd party service but also won't allow simulating scenarios &nbsp; ❌;

<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file
```
// Show simple nock definition
```
</details>

<br/><br/>

### ⚪️ 2.  Define default responses before every test to ensure a clean slate

🏷&nbsp; **Tags:** `#basic`

:white_check_mark:  **Do:** Typically one wishes to define *default* responses to HTTP requests and might need to override with custom behavior for specific tests (i.e. simulate some specific response). To ensure tests don't step on each other toes, define the default HTTP responses inside the hook that is executed before each test (Jest - beforeEach, Mocha - before), and clean-up after every test. Why? This way, every test will face the default behaviour and not some custom and surprising behavior that was defined by the previous test. You might see a minor performance degradation since the HTTP requests are being redefined many times - We have benchmarked this and found that the cost is 1ms per test

<br/>

👀 &nbsp; **Alternatives:** It's possible to define the HTTP responses once in the before-all hook, in this case should some test intentionally or mistakenly override the behavior - It will affect all the tests ❌ &nbsp; You may define in every test the HTTP responses that are relevant for this test - It's likely to end with tedious repetitions of the same code ❌&nbsp;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
```
// Show before and after each
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 3.  Override the happy defaults with corner cases using unique paths

🏷&nbsp; **Tags:** `#advanced, #draft`

:white_check_mark:  **Do:** A common need is happy path + corner cases, not possible technically to change existing path - need to remove. Instead of removing, create unique path and unique response. Do this by acting on unique resources. If not possible, other option is global scope. This minimizes coupling between tests. 

Remember that after every test everything is cleaned-up, see bullet about clean-up.

<br/>

👀 &nbsp; **Alternatives:** Don't have default  ❌ &nbsp; ; Use global scope ❌&nbsp;;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
   ```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 4. Deny all outgoing requests by default 

🏷&nbsp; **Tags:** `#basic`

:white_check_mark:  **Do:** Instruct the network interceptor to block and warn on any outgoing HTTP request that is not intercepted. Blocking all calls typically requires no more than one statement `nock.disableNetConnect()`. For any request that was not explicitly defined - the interceptor will throw an exception and make the tests fail.  Why is this needed? To protect the component borders. It might be that some HTTP calls were not considered and trying to hit a real external server. When requests are not intercepted, it violates the component isolation, triggers flakiness, and degrades performance. Remember to exclude calls to the local API under test that should serve the tests` requests. When the test suite is done, remove this restriction to avoid leaving unexpected behaviour to other tests suites.

<br/>

👀 &nbsp; **Alternatives:** Trust your familiarity with the code and assume that all network calls were configured for interception. This dictates that any developer who puts HTTP requests in the code remembers to update the testing configuration - Isn't this a fragile assumption?   ❌ &nbsp; Some interceptor tools allow recording and inspecting the traffic - This  information is valuable for periodical review(see dedicated bullet on recoding) but not an ongoing guard ❌

<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file
```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
    ```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 5.  Simulate network chaos

🏷&nbsp; **Tags:** `#basic`

:white_check_mark:  **Do:** Go beyond the happy and sad paths. Check not only errored responses (e.g., HTTP 500 error) but also network-level anomalies like slow and timed-out responses. This will prove that the code is resilient and can handle various network scenarios like taking the right path after a timeout,  has no fragile race conditions, and contains a circuit breaker for retries. Reputable interceptor tools can easily simulate various network behaviors like hectic service that occasionally fail. It can even realize when the default HTTP client timeout value is longer than the simulated response time and throw a timeout exception right away without waiting
<br/>

👀 &nbsp; **Alternatives:** Checking only HTTP responses, without simulating network corener cases, is sensible for non-critical integrations ✅ &nbsp; 
<br/>

<details><summary>✏ <b>Code Examples</b></summary>

//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 6.  Catch invalid outgoing requests by specifying the request schema

🏷&nbsp; **Tags:** `#basic`

:white_check_mark:  **Do:** When checking that the component did send HTTP requests, also check the request's validity. For example, when checking that an email was sent, it's not enough to ensure that HTTP call was made to the right URL, it's imperative to verify that the body contains the necessary fields like email address and mail subject. By doing so, the tests cover one more layer of bugs:  integration issues. You may achieve this by storing the outgoing request as a local variable and asserting that its schema, sometimes even the data, is as expected. Why is this important? When isolating a component by intercepting network requests, the tests hide bugs and sugarcoat the reality. By default, no matter how a request looks like, the response will be successful. The 3rd party service validation is avoided and will come into play only in production. The minimum act to mitigate this line of risks is to assert the correctness of the request. While a good start, it won't cover all the integration risks - What if a collaborator service was changed and the tests were not updated? This will get discovered only in production. Therefore, more techniques are needed to cover all the integration risks (See below on E2E and contract tests).

<br/>

👀 &nbsp; **Alternatives:** Some rely on E2E test to check integration - This layer is valuable and needed as a last chance safety net. However, due its flakines, it's should be used sparingly and not as a primary testing tool  ❌ &nbsp; What if there is misaligement on the exact values and requests sequence that we should be made? In this case, consumer-driven contract tests might be valuable (though pricey) ✅&nbsp;;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```

version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 7.  Record real outgoing requests for awareness

🏷&nbsp; **Tags:** `#advanced`

:white_check_mark:  **Do:** Various tools and network interceptors (e.g., nock) can tell about the existence and nature of outgoing HTTP requests. Run one of those tools as you plan test cases to realize which end-points and scenarios should get covered. With local interceptors that are made for testing (e.g. [nock recording](https://github.com/nock/nock#recording))., recording mode should be enabled when the tests run - Then all the network traffic will get captured in local files. Why is this important? You might miss end-points or, more likely, miss some corner scenarios. For example, one may believe that 'GET: /users/:id' returns only HTTP 200 with a body, the code relies on this response. In reality, this end-point also sometimes returns HTTP 204 with an empty body. If this is not tested before production, it will get tested in production... For complex and critical scenarios, consider also watching the **production** network logs to realize the various potential scenarios.

<br/>

👀 &nbsp; **Alternatives:** Rely on your familairity with the code and trust that you didn't miss any network flow  ❌ &nbsp; Manually skim through API documentation (e.g. OpenAPI)  ✅&nbsp;;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 8.  Fake the time to minimize network call duration

🏷&nbsp; **Tags:** `#basic, #draft`

:white_check_mark:  **Do:** Interception tools include record mode which ...; use this to become aware of the integration it self, but also to its various patterns. Ensure all variations are covered with testing. You may use the recorded file as default; Do this in staging environment; Valuable when there are many integrations.

<br/>

👀 &nbsp; **Alternatives:** Persist  ❌ &nbsp; ; In every test ❌&nbsp;;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

## **Section: Dealing with data**


<br/>


### ⚪️ 1.  Important: Each test should act on its own records only

🏷&nbsp; **Tags:** `#strategic`

:white_check_mark:  **Do:** 
Any record that might affect the test results should be added at the beginning of the test. Excelemation mark. Doing so will result in short and self-contained test stories that the occasional reader can easily troubleshoot without skimming through the entire file. A common mistake is to seed the whole test data globally - This leads to high coupling and complexity. Specifically, failing to keep the tests self-contained will lead to the Domino effect: Understanding why test num #27 failed demands reading the 26 tests before. Each might have mutated the global data. Other undesired side effects: One can't run a single test becuase it depends on data that is generated by previous tests; It will get much harder to understand the test intent becuase the gun that is being shown on the last scene was never introduced before ([The mystery guest syndrome](http://xunitpatterns.com/Obscure%20Test.html#Mystery%20Guest)). Are you concerned with performance? Based on our benchmarks, adding relevant data at the beginning of each test add ~1 second to the execution time - Absolutely worth the decreased complexity. This advice is valuable only to records that are the subject of the tests. Tests can have different types of data, see next bullet [and this diagram](/graphics/test-data-types.png "Test data types").

<br/>

👀 &nbsp; **Alternatives:** Seed data before all the tests - This will end in spaghetti dependencies between all the tests  **files** ❌ &nbsp; ; Seed at the beginining of each file - Same spaghetti, only smaller  ❌&nbsp;;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
test('When asked for an existing order, Then should retrieve it and receive 200 response', async () => {
    //Arrange - Create a record so we can later query for it and assert for is existence
    const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
    };
    await axiosAPIClient.post(`/order`, orderToAdd);

    //Next -> Invoke the route under test and asssert for something
});
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/master/example-application/test/basic-tests.test.js#L49-L74)
  

</details>

<br/><br/>

### ⚪️ 2.  Only metadata and context data should get pre-seeded to the database

🏷&nbsp; **Tags:** `None`

:white_check_mark:  **Do:** Some data is not related to the tests flow. The test reader can understand and troubleshoot the test easily without being aware of it. For example, look-up table of all the currencies or countries in the world. There is no benefit in filling this tables again and again in every test file. How do we make the differentiation? Let's define more specifically 3 types of test data:

- **Metadata** - General purpose lists and lookups that are needed for the app to perform but are not related at all with the test's subject. For example, currencies list, countries, roles list, and similar. This data can get seeded once globally. There is no point in re-adding it per test or file

- **Context data** - Required records that hold a relationship with the subject under test but are not being tested directly. For example, consider an e-commerce purchase flow tests: The User entity, Shop entity, Business entity are all a parent or sibling of the Order that is being tested. They might affect the test result (e.g., Trying to order goods when the user was deleted) but are not the direct subject of the test. To keep the tests short and focused, this data can be added per file, if they affect the test results  - Add the data per test

- **Test records** - This is the data that is actually being tested and likely to be added or mutated. The reader must directly see what data exists to understand the results of the test. For this reason, explicitly define and add this information inside the test. Going with the same e-commerce site example, when testing the purchase flow, add the order records within the test

[See comparison table here](/graphics/test-data-types.png "Test data types").


<br/>

👀 &nbsp; **Alternatives:** Per-suite, expensive  ❌ &nbsp; ; In every test ❌&nbsp;;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
// Adding metadata globally. Done once regardless of the amount of tests
module.exports = async () => {
  console.time('global-setup');
  ...
  await npmCommandAsPromise(['db:seed']); // Will create a countries (metadata) list. This is not related to the tests subject
  ...
  // 👍🏼 We're ready
  console.timeEnd('global-setup');
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/master/example-application/test/global-setup.js#L32)

<hr>

```javascript
describe('/api', () => {
  let user;

  beforeAll(async (done) => {
    // Create context data once before all tests in the suite
    user = createUser();

    done();
  });

  describe('GET /order', () => {
    test('When asked for an existing order, Then should retrieve it and receive 200 response', async () => {
      //Arrange
      const orderToAdd = {
        userId: user.id, // Must provide a real user id but we don't care which user creates the order
        productId: 2,
        mode: 'approved',
      };
      const {
        data: { id: addedOrderId },
      } = await axiosAPIClient.post(`/order`, orderToAdd);
      ...
    });
  });
});
```
<hr>

```javascript
test('When asked for an existing order, Then should retrieve it and receive 200 response', async () => {
    //Arrange - Create a record so we can later query for it and assert for is existence
    const orderToAdd = {
        userId: 1,
        productId: 2,
        mode: 'approved',
    };
    await axiosAPIClient.post(`/order`, orderToAdd);

    //Next -> Invoke the route under test and asssert for something
});
```
➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/master/example-application/test/basic-tests.test.js#L49-L74)
</details>

<br/><br/>

### ⚪️ 3.  Assert the new data state using the public API

🏷&nbsp; **Tags:** `#basics`

:white_check_mark:  **Do:**  After invoking the route under test, a new state is likely to exist (e.g., new records) -  Assert that the new state data is satisf
ory **using the REST API** when applicable. By approaching through the API, the test simulates the most important flow: The user flow. What's wrong with approaching the DB directly? Not only it goes through a different journey than the user, but also the test might miss a bug in the API that returns the data (i.e., DB data is correct, the query code hides a bug). Sometimes, such REST API does not exist - In this case, use the outermost layer that does expose this info like controller, service, facade, or repository. The more external this layer is, the more bugs are caught, and the coupling to the internals` noise is minimized.

This design decision does not come without a caveat. The test invokes much more code than needed: Tests might fail because of failures in code not being directly tested. Our philosophy is to stick to user flows under realistic conditions at the cost of a slight increase in developer's sweat. 

<br/>

👀 &nbsp; **Alternatives:** Approach the DB directly - Miss bug in the query code, higher exposure to internal refactoring  ❌ &nbsp; Approach the ORM - Not ideal for the same reasons like the option above ❌&nbsp; Approach the service layer - Better than approaching the DB directly as it will be less sensitive to DB schema changes and resemble more the user flow &nbsp;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>



### ⚪️ 4.  Important: Choose a clear data clean-up strategy: After-all (recommended) or after-each

🏷&nbsp; **Tags:** `#strategic`

:white_check_mark:  **Do:** The timing when the tests clean the database determines the way the tests are being written. The two most viable options are cleaning after all the tests vs cleaning after every single test. Choosing the latter option, cleaning after every single test guarantees clean tables and builds convenient testing perks for the developer. No other records exist when the test starts, one can have certainty which data is being queried and even might be tempted to count rows during assertions. This comes with severe downsides: When running in a multi-process mode, tests are likely to interfere with each other. While process-1 purges tables, at the very moment process-2 queries for data and fail (because the DB was suddenly deleted by process-1). On top of this, It's harder to troubleshoot failing tests - Visiting the DB will show no records.

The second option is to clean up after all the test files have finished (or even daily!). This approach means that the same DB with existing records serves all the tests and processes. To avoid stepping on each other's toes, the tests must add and act on specific records that they have added. Need to check that some record was added? Assume that there are other thousands of records and query for records that were added explicitly. Need to check that a record was deleted? Can't assume an empty table, check that this specific record is not there. This technique brings few powerful gains: It works natively in multi-process mode, when a developer wishes to understand what happened - the data is there and not deleted. It also increases the chance of finding bugs because the DB is full of records and not artificially empty. It's not perfect, though, since the DB is stuffed with data - Data that goes to unique columns might be duplicated. When adding 10 records and asserting their existence, a more sophisticated query will be needed. All of these challenges have reasonable resolutions (read the next bullets, for example, unique values can get random suffix). [See the full comparison table here](/graphics/db-clean-options.png "Choosing the right DB clean up strategy").

Who wins? There's no clear cut here. Both have their strength but also unpleasant implications. Both can result in great testing solution. Our recommended approach is cleaning up occasionally and accepting the non-deterministic DB state. This option resembles more the production environment, leads to more realistic tests and when done right will not show any flakiness. A bit of more sweat for more realism.

<br/>

👀 &nbsp; **Alternatives:** Using transactions can also take care to clean up the DB automatically. The test will pass an open transaction to the code under test and finally abort the transaction. It's not recommended because the tests get more coupled to the code internals. It also generates cascading transactions model that complicates if the code already contains transactions. Lastly, it works only with particular DB that supports transactions   ❌ &nbsp; 
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 5.  Add some randomness to unique fields

🏷&nbsp; **Tags:** `#intermediate`


:white_check_mark:  **Do:** Commonly, tests will need to add records to columns with unique constraints. Since multiple tests are likely to add the same value, add a tiny random value as a suffix. Collisions between tests are more likely to occur if the DB is not cleaning up after each test (See bullet: Choose a clear data clean-up strategy). When the data is retained, the 1st tests execution will pass but the 2nd will fail due to a unique constrain violation. Adding randomness is a good practice also when the tables are being cleaned after each test - Without it, a test writer must read all the previous tests to ensure no similar names were chosen. When adding a random value, it's better to keep the data descriptive and meaningful with a minor suffix. The test reader will surely learn more about the system this option {resident: 'Washinton avenue 17st NY {23-554}' comparing with this one {resident: '23-553'}. Tests are great example-based documentation, sadly the 2nd option above kills this opportunity. Keep the random suffix short, a combination of process id and the current time seconds is likely go be good enough.

<br/>

👀 &nbsp; **Alternatives:** Clean the DB after each test - Read above about some caveats that are attached with this option (See bullet: Choose a clear data clean-up strategy)  ❌ &nbsp; 
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 6.  Test also the response schema. Mostly when there are auto-generated fields

🏷&nbsp; **Tags:** `#advanced`


When it is impossible to assert for specific data, check for mandatory field existence and types. Sometimes, the response contains important fields with dynamic data that can't be predicted when writing the test, like dates and incrementing numbers. If the API contract promises that these fields won't be null and hold the right types, it's imperative to test it. Most assertion libraries support checking types. If the response is small, check the return data and type together within the same assertion (see code example). One more option is to verify the entire response against an OpenAPI doc (Swagger). Most test runners have community extensions that validate API responses against their documentation.

<br/>

👀 &nbsp; **Alternatives:** When app maintains JSON Schemas of common payloads, most test runners can validate a JSON object (i.e. the API response) against JSON Schema ✅ &nbsp; 
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 7.  Install the DB schema using the same technique like production

🏷&nbsp; **Tags:** 


:white_check_mark:  **Do:** In testing, use the same mechanism and code that installs the DB tables in production. Typically this will be a migration command (i.e., ORM) or .sql files invoked by a bash command. In principle, any production element that can be copied to testing is a blessing - It covers another layer of bugs. Should you mistakenly re-ceate an existing table or rename a non-existing column, this glitch will get caught during coding long before deployment. A recommended place to invoke the installation is within the global test setup - This way, there is no way to run the tests without its pre-requisites (see more in the section 'Infrastructure Setup') 

<br/>

👀 &nbsp; **Alternatives:** Manually copy a DB dump - This is a great way to find installation issues only in production and also complicate the developer testing experience  ❌ &nbsp; Automate a custom testing installation command (e.g., Docker with pre-defined tables, custom code) - Same caveats like previous paragraph ❌&nbsp;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>


### ⚪️ 8.  Test for undesired side effects 

🏷&nbsp; **Tags:** `#advanced`


:white_check_mark:  **Do:** Check that the code under test doesn't accidentally ״overdoing״ -  modifying more data than it is intended to. For example, a code that is supposed to delete one record, might accidentally delete all the records. Since most tests assert only the outcome of specific records, it's easy to miss these unplanned side effects. Testing this is a bit tricky but not too hard. At the beginning of a test, add the records that should be mutated—nothing unusual thus far. On top of this, add few more records than needed. In the end, assert that the records that were planned to be mutated are indeed mutated, but the rest are not. For example, when testing that the DELETE route works, add 2 records (!), try to delete one, ensure that it is gone, now also check that the second one is still there so the test deleted only what should be deleted (Credit: @giltayar)

<br/>

👀 &nbsp; **Alternatives:** Some apply Repository/ORM level protection that ensures that one tenant is not accessing another tenant's records. This is valuable but doesn't cover all the scenarios ❌  &nbsp; Writes integration tests that include the data access layer and a real DB - Check that the number of affected records (i.e., commonly returned by DB operations) is as expected. Writing tests against the entire DAL demands more effort thus should be considered based a specific project's risk level ❌&nbsp;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

## **Section: Message queues**

### ⚪️ 1.  Important: Use a fake MQ for the majority of testing

🏷&nbsp; **Tags:** `#intermediate, #strategic`
  
:white_check_mark: **Do:** Create your own simplistic MQ fake and use it for the majority of testing. Real message queues are hard to purge between tests and will lead to flakiness. In principle, one should strive to use the same infrastructure like production - a real message queue container within a docker-compose (like done with the database). Unfortunately, MQ is a beast that is harder to tame. Queues must get cleaned between tests, (e.g., otherwise, test2 will fetch test1 message). Purging a queue is slow and not deterministic. When the purge/delete command arrives, some messages are in transit and the queue will not delete those until it get acknowledgment. Not only this, in a multi-process mode different processes will step on each others toes. A potential resolution is to create a dedicated queue per test, doing so will kill flakiness but at the same time will kill the performance. Real message queue is needed to test full flows and advanced features (e.g., retries) but is not convenient enough to serve as the primary technique during coding.

A better alternative is to use a simplistic fake that does nothing more than accepting messages, passing them to subscribers/consumers and emitting events when ack/delete happens. This fake will allow the tests to publish messages in-memory and subscribe to events to realize when interesting things happened (e.g., a message was acknowledged). Anyway, the primary mission statetement of the tests is to check how the _app_ behaves and not the well-trusted MQ product. With a fake, all is stored in-memory with simple flows and super-fast performance. Writing a fake like this should not last more than few hours (See code example here and below). The only downside is that it is not suitable to check multi-legs flow like dead-letter queues, retries, and the production configurations. Since these specific tests are slow by nature, they anyway should be executed rarely. Given all of this background, a recommended MQ testing strategy is to use simplistic-fake for the majority of the tests, mostly the tests that cover the app flows. Then to cover other risks, write just a few E2E tests over a production-like environment with a real message queue system.

[See comparison diagram here](/graphics/mq-comparison.png "Which MQ to use for testing").

<br/>

👀 &nbsp; **Alternatives:** Stub the message queue listener (the code that subscribes to the queue). Within the test, Mock this listener code to emit new fake MQ messages. While doable, this is not recommended. The listener layer is responsible for catching errors and mapping the result to some MQ action like acknowledgment or rejection. Leave this layer within the test scope ❌ &nbsp; Use a message queue in the cloud - This alternative will suffer from the same issues like real MQ, only it will be even slower ❌ &nbsp;

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
// fake-mq.js, Simplistic implementation of MQ client for testing purposes
// Note: This is code is even more simplified, see full example in the example application
class FakeMessageQueueProvider extends EventEmitter {
  async ack() {
    this.emit('message-acknowledged', { event: 'message-acknowledged' }); //Let the test know that this happened
  }

  async sendToQueue(queueName, message) {
    this.emit('message-sent', message);
  }

  async consume(queueName, messageHandler) {
    // We just save the callback (handler) locally, whenever a message will put into this queue
    // we will fire this handler
    this.messageHandler = messageHandler;
  }

  async pushMessageToQueue(queue, newMessage) {
    this.messageHandler(newMessage);
  }
}
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>
  

### ⚪️ 2. Promisify the test. Avoid polling, indentation, and callbacks

  

🏷&nbsp; **Tags:** `#advanced, #strategic`


:white_check_mark: **Do:** Design the message queue client/wrapper to throw events after every message handling. These events will let the test know when the operation is done, and the assertion part can start. Unlike API, message queue flows are hard to track. A typical test puts a message in the queue, some flow starts, and then at some _unknown_ point in time, it ends. The test is left hanging, not knowing when it can check for the new state. Some overcome this by polling the DB for the desired changes (slower and flaky). The first step in making this better is taking advantage of the fact that after every flow, the handling code is acknowledging the message. The test can tap on this event. Implementation-wise, the MQ client should throw an event when it gets confirmation/rejection. The test will subscribe and be informed. One more enhancement is left: Events by nature are implemented with callbacks (e.g., EventEmitter, EventTarget). Callbacks will put an indentation in the test and complicates the flow (i.e., subscribe and handle first, then act and put a message in a queue). A simple solution is to _promisify_ the event to achieve a super simple and flat test! See a code example below

<br/>

👀 &nbsp; **Alternatives:** Poll until the new desired state (e.g. new DB record) is met - This isn't horrible using the right helpers, just a bit slower and more complicated to write ❌ &nbsp; Subscribe for events from the MQ itself, once a message was confirmed it's the right time to assert - Not supported by all MQ products and also much slower ❌&nbsp;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
// message-queue-client.js. The MQ client/wrapper is throwing an event when the message handler is done
  async consume(queueName, onMessageCallback) {
    await this.channel.consume(queueName, async (theNewMessage) => {
      await onMessageCallback(theNewMessage);
      await this.ack(theNewMessage); // Handling is done, acknowledge the msg
      this.emit('message-acknowledged', eventDescription); // Let the tests know that all is over
    });
  }


```

```javascript
// The test listen to the acknowledge/confirm message and knows when the operation is done 
test('Whenever a user deletion message arrive, then this user orders are also deleted', async  ()  => {

// Arrange

// 👉🏼 HERE WE SHOULD add new orders to the system

const  getNextMQEvent =  once(MQClient, "message-acknowledged"); // Once function, part of Node, promisifies an event from EventEmitter

// Act
fakeMessageQueue.pushMessageToQueue('deleted-user', { id:  addedOrderId });  

// Assert
const  eventFromMessageQueue = await  getNextMQEvent; // This promise will resolve once the message handling is done

// Now we're certain that the operations is done and can start asserting for the results 👇 
});
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>



### ⚪️ 3.  Test message acknowledgment and 'nack-cknowledgment'

🏷&nbsp; **Tags:** `#advanced, #strategic`

:white_check_mark:  **Do:** This bullet is about the bread and butter of message queue testing. Act by putting a message in the queue, assert that it triggered the correct behavior (e.g., a record was added or deleted), then assert that the message was acknowledged or deleted (depends on the specific MQ product). Checking only the app logic, without reporting back to the MQ, is like testing against API without checking the HTTP response status. In the same spirit, also check for the opposite - Once a failure occurs, the message is not being acknowledged, so it will get back to the queue. These tests will stretch the efficiency of the app error handler - Any kind of exception should get caught and result in an adequate response to the MQ: Acknowledge or not

<br/>

👀 &nbsp; **Alternatives:** Focus only on the app logic and state - Might miss scenarios where the MQ is not being informed and messages are re-processed again and again ❌ &nbsp; Test this only using E2E tests using a real queue by asserting the number of messages - It's harder to trigger various errors (e.g., data access layer is throwing an exception) from E2E level ❌ &nbsp;

<br/>

<details><summary>✏ <b>Code Examples</b></summary>

```javascript
//Putting a delete-order message, checking the the app processed this correctly AND acknowledged
test('Whenever a user deletion message arrive, then his orders are deleted', async  ()  => {

// Arrange
// Add here a test record - A new order  of a specific user using the API

const  fakeMessageQueue = await  startFakeMessageQueue();
const  getNextMQEvent =  getNextMQConfirmation(fakeMessageQueue);

// Act
fakeMessageQueue.pushMessageToQueue('deleted-user', { id:  addedOrderId });

// Assert
const  eventFromMessageQueue = await  getNextMQEvent;
// Check here that the user's orders were deleted
expect(eventFromMessageQueue).toEqual([{ event:  'message-acknowledged' }]);
});
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>


### ⚪️ 4.  Test processing of messages batch

🏷&nbsp; **Tags:** `intermediate`

:white_check_mark:  **Do:** Feed the test queue with a batch of messages, and simulate failures in specific messages. In the realm of these failures, assert that some messages do succeed and the consumer survives to re-fetch more messages. A batch of messages will trigger different risks than a single message - It might be that the entire batch processing will crash, although only specific messages are invalid (others should have been processed successfully). The test expects the client code to recover and fetch more despite the failures, did it? . In streaming applications, a failure in a single message might lead to dis-acknowledgment of the entire sequence or to acknowledge the last (ignore the error). Whatever your strategy is, a test is needed. When using real-queues, the number of messages that are being put should be bigger than a single fetch size (e.g., prefetch in Rabbit, MaxNumberOfMessages in SQS) - Check that although the batch contains errors, the 2nd page is also being fetched and handled.

<br/>

👀 &nbsp; **Alternatives:** One might assume that correct handling of a failure proves that the consumer is resilient - In reality, it might be that the consumer code stops when a single message fails and won't re-connect to fetch more &nbsp;
	<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>

### ⚪️ 5.  Test for 'poisoned' messages

🏷&nbsp; **Tags:** `#intermediate`


:white_check_mark:  **Do:** Put an invalid message in a queue and assert that hell does not break loose. More specifically, check that the consumer rejects the message, it stays alive, and a proper monitoring metric is fired. Poisoned messages are known MQ phenomena where some invalid/old messages in the queue cause the handler to crash. For example, when due to sender fault a wrong messages schema is stored in a queues and the consumer is not ready for this. Since the consumer crashes, the messages are being served again and again and can paralyze an app. One should not assume a perfect queue content rather embrace a resilient approach - The consuming code should validate each incoming message schema and stop early in case of failures. On the broker/server-side, retry limit should be explictly defined. When the limit is passed, messages should get redirected to the dead-letter queue (see dedicated bullet)

<br/>

👀 &nbsp; **Alternatives:** Share Schemas between publishers and consumers so there are fewer conflicts - In a distributed architecture that is built by different teams, it's not practical to count on a sanitized environment ❌
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>

### ⚪️ 6.  Test for idempotency


🏷&nbsp; **Tags:** `#intermediate`


:white_check_mark:  **Do:** Simulate a scenario where the same message arrives twice 'mistakenly,' and assert that it doesn't trigger an undesired state like the same operation done twice. A known limitation of most MQ is 'at least once delivery', which means that the same message might arrive more than one time. Running the same operation multiple times can be unbearable for some business flows - Consider a Payment flow where some fees are withdrawn from the user account more than once. Write a test that put some state, then put the same message twice and check that the final state is satisfactory (e.g., the app charged only once).

<br/>

👀 &nbsp; **Alternatives:** Some MQ products can guarantee exactly-once delivery (usually demands sacrificing other factors like performance), this a viable option under some scenarios ✅  &nbsp; 
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>

### ⚪️ 7.  Avoid a zombie process by testing connection failures

🏷&nbsp; **Tags:** `#advanced, #strategic`


:white_check_mark:  **Do:** Fake a connection/subscription error and ensure that the client retries, and finally, it crashes. This specific failure is outstanding - If the code crashes at this phase, the process won't consume any message and do nothing. You just got a zombie process, sad. Alternatively, should the process fire a metric and crash after few retries, it will increase the chances of the monitoring system realizing the anomaly. Some runtime infrastructure (.e.g, Kubernetes) can auto-heal this scenario by relocating failing processes to different machines or zones. This better treatment will happen only if the code exits, which like anything else, happens in reality if you test it. To achieve this test flow, simulate a connection failure using a stub or wrong MQ URL. You can also set a one-time failure (e.g., The 'MQ.subscribe' method fails only once) to ensure that the connection retries and succeeds finally. 

<br/>

👀 &nbsp; **Alternatives:** Put a try-catch, log the error, then test the logs - If the connection failed x times, it would keep failing. All the consumer processes will be alive, using resources for no reason instead of being moved and restarted by the infrastructure ❌  &nbsp;
<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>

### ⚪️ 8.  On top of development testing, write a few E2E tests

🏷&nbsp; **Tags:** `#intermediate`

:white_check_mark:  **Do:** Write a few, no more than a few, tests against a production-like environment to realize configuration mismatches. All the tests that were described thus far are concerned with the app code. It is not unusual that the code seems fine, but production issues are triggered by MQ installation and configuration. For example, the code might expect a different queue/topic name than what was defined in production. There are many other configurations that affect the message flow like whether acknowledgement are needed and how many time to retry. Beyond configuration, some MQ functionality demands simulating an entire flow like message failing multiple times - These tests are slower by nature and better get separated from the core set of tests. Practically, create a dedicated file for these tests so they can be executed occasionally (e.g., during deployment smoke testing)

<br/>

👀 &nbsp; **Alternatives:** Manual testing during deployment - The value of automation is probably evident at this point ❌  

<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file

```
version: "3.6"
services:
  db:
    image: postgres:11
    command: postgres
    environment:
      - POSTGRES_USER=myuser
      - POSTGRES_PASSWORD=myuserpassword
      - POSTGRES_DB=shop
    ports:
      - "5432:5432"
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/>


<br/>

<br/>

## **Section: The test anatomy**


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
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTEwMjkyNzI0NTEsLTE3NDI5MDgyNDYsNT
Q3NTA0NTgxLC0xOTYwNzg3MDM1LC0xODE4NDQ2NjczLC0xMDk5
MTY4MjgsLTYyOTE1OTQ4OCwxNjA3NTk0OTcyLC05MDg0MzYwOD
EsMTY4MDUxMzAwOSwzNzQ4OTE1OTAsLTc2MzEyODU0NiwxMjIw
MTY3OTU1LDE5MTAxOTA1NTgsMTY2MjgyMzQ2MSwyOTQzODEyOD
QsLTYyOTYwNTc2OSwyMDgyMDg2NzEzLC0yMTA5MzQyOTAsMTkx
Mjc5NjY1OF19
-->