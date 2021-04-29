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


# 6 min explainer video


https://user-images.githubusercontent.com/8571500/115119222-ef6e2b80-9faf-11eb-8fd9-60c58bbcac59.mp4




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

:white_check_mark: &nbsp; **Do:** All the databases, message queues and infrastructure that is being used by the app should run in a docker-compose environment for testing purposes. Only this technology check all these boxes: A mature and popular technology that can't be reused among developer machines and CI. One setup, same files, run everywhere. Sweet value but one remarkable caveat - It's different from the production runtime platform. Things like memory limits, deployment pipeline, graceful shutdown and a-like act differently in other environments - Make sure to test those using pre-production tests over the real environment. Note that the app under test should not neccesserily be part of this docker-compose and can keep on running locally - This is usually more comfortable for developers


<br/>

👀 &nbsp; **Alternatives:** A popular option is manual installation of local database - This results in developers working hard to get in-sync with each other ("Did you set the right permissions in the DB?") and configuring a different setup in CI ❌; Some use local Kuberentes or Serverless emulators which act almost like the real-thing, sounds promising but it won't work over most CIs vendors and usually more complex to setup in developers machine❌;  

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

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 2. Start docker-compose using code in the global setup process

🏷&nbsp; **Tags:** `#strategic`

:white_check_mark:  **Do:** In a typical multi-process test runner (e.g. Mocha, Jest), the infrastructure should be started in a global setup/hook ([Jest global setup](https://jestjs.io/docs/en/configuration#globalsetup-string)), [Mocha global fixture](https://mochajs.org/#global-setup-fixtures)  using custom code that spin up the docker-compose file. This takes away common workflows pains - The DB is an explicit dependency of the test, no more tests failing because the DB is down. A new developer onboarded? Get him up to speed with nothing more than ```git clone && npm test```. Everything happens automatically, no tedious README.md, no developers wonder what setup steps did they miss. In addition, going with this approach maximizes the test performance: the DB is not instantiated per process or per file, rather once and only once. On the global teardown phase, all the containers should shutoff (See a dedicated bullet below) 

<br/>


👀 &nbsp; **Alternatives:** A popular option is manual installation of local database - This results in developers working hard to get in-sync with each other ("Did you set the right permissions in the DB?") and configuring a different setup in CI ❌; Some use local Kuberentes or Serverless emulators which act almost like the real-thing, sounds promising but it won't work over most CIs vendors and usually more complex to setup in developers machine❌;  

<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file
```
//Put global setup code here
```

➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>


### ⚪️ 3. Shutoff the infrastructure only in the CI environment

🏷&nbsp; **Tags:** `#performance`

:white_check_mark:  **Do:** Keep the database and other infrastructure always alive in developers' machine so the next tests run will start at a glance, typically in 3-5ms. This super-fast start-up will encourage developers to run the tests continously and treat them as a coding companion: It's an amazing coding experience to have the tests running all the time and watching your back as you type. Keeping the DB alive requires a clear data clean-up strategy, see our recommendation below. What about CI environment? This careful tune-up is mostly important in a developer machine where the test might get executed very frequently (e.g. after every editor save, once a minute), in a CI environement the next tests execution might happen in a different machine and there is no motivation to keep the the docker-compose up.

<br/>


👀 &nbsp; **Alternatives:** Should you teardown the docker-compose and restart in every tests execution, the startup time is likely to be 20x slower and is likely to kill this continous-testing experience ❌;   

<br/>

<details><summary>✏ <b>Code Examples</b></summary>
//docker-compose file
```
// Put teardown code that shows how we check for CI
```
➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

</details>

<br/><br/>

### ⚪️ 4. Optimize your real DB for testing, Don't fake it

🏷&nbsp; **Tags:** `#performance, #review, #Michael`

:white_check_mark:  **Do:** Use the same DB like production and optimize it for testing by turn off the DB durability settings. Avoid fake DBs, it brings noise and impair the completeness of the tests by excluding the DB from the test. Optimized DB is fast enough for testing and you can run hundrands of tests in a few seconds! 

<br/>

👀 &nbsp; **Alternatives:** Use SQLite which is actually slower ❌;  no optimizations



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
//docker-compose file
```
// Show global-setup conditional migration command
//Show npm script
```
➡️ [Full code here](https://github.com/testjavascript/nodejs-integration-tests-best-practices/blob/fb93b498d437aa6d0469485e648e74a6b9e719cc/example-application/test/docker-compose.yml#L1
)
  

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

:white_check_mark:  **Do:**  Go beyond happy and sad path. Check not only errored responses (e.g. HTTP 500 error) but also network-evel anomalies like slow and timed-out responses. This will prove that the code is resillient and can handle various network scenarios like taking the right path after a timeout,  has no fragile race conditions and has a circuit breaker for retries. Tools like nock can easily simulate various network behaviours like hectic service that sometimes occasionaly fail. It can even realize when the default HTTP client timeout is longer than the simulated response time and throw a timeout exception right away without waiting
<br/>

👀 &nbsp; **Alternatives:** Given a generic HTTP client utility - This can be tetsed only once  ❌ &nbsp; ; 
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

### ⚪️ 6.  Catch incorrect requests by specifying the request schema

🏷&nbsp; **Tags:** `#basic, #draft`

:white_check_mark:  **Do:** When faking collaborators, risk of incorrect interactions, we sugar coat the reality with always valid responses. One mitigation, is to detail the request properties and body. Example: mail without title. Don't be too specific. 

<br/>

👀 &nbsp; **Alternatives:** Catch-all and rely on E2E test, too late to discover bugs  ❌ &nbsp; ; Run PACT tests as well - Good approach ✅&nbsp;;
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

### ⚪️ 7.  Record real requests for awareness

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

## **Dealing with data**

<br/>


### ⚪️ 1.  Each test should act on its own records only

🏷&nbsp; **Tags:** `#strategic, #advanced, #draft`

:white_check_mark:  **Do:** Any record that effects the test results should be added at the begining of the test. Excelemation mark. A common mistake is to seed the entire test data or add one per suite - Leads to coupling between tests. What if test num #37 deletes the entity that test #38 relies on? Also lead to obscure tests... A test is a standlone story with <7 statements. Based on our benchmarks, this adds ~1 second to the test execution time - Abolutely worth the decreased complexity.

3 types of data: metadata, context and records

<br/>

👀 &nbsp; **Alternatives:** Seed globally  ❌ &nbsp; ; Seed per suite ❌&nbsp;;
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

### ⚪️ 2.  Only metadata should be pre-seeded to the database

🏷&nbsp; **Tags:** `#basic, #draft`

:white_check_mark:  **Do:** Data that never changes based on the test interactions is called "metadata", for example - currencies, countries, etc. This type of data makes no impact on the tests result but is needed for the app to work. One can understand and maintain a test without being aware of this data. Since it never mutated, it can be seeded globally to the DB in the migration phase. Otherwise performance

<br/>

👀 &nbsp; **Alternatives:** Per-suite, expensive  ❌ &nbsp; ; In every test ❌&nbsp;;
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

### ⚪️ 3.  Clean DB after all tests suites finish

🏷&nbsp; **Tags:** `#advanced, #advanced, #draft`

:white_check_mark:  **Do:** This is an open discussion in the testing community, when should test data get cleaned out: after each test, each suite, use transactions or just clean in the end. Any options has unpleasant implications, cleaning in the end is the best amont the worst. Any option but clean in the end will lead to a significant implication. In multi-process runner, trying to clean-out after each test or test suite (i.e. file) might result in deleting data to other executing process. Cleaning in the end scores best in terms of performance but might trigger collission between tests - Overcome this by adding some randomness to your test data. Some randomness is anyway needed for unique columns.

<br/>

👀 &nbsp; **Alternatives:** Transactions, no need to clean-up, but leads to cascading transaction, won't work in noSQL DB and harder to debug since the data does not persist  ❌ &nbsp; ; After every test - Not only bad performance, will fail in multi-process runner ❌&nbsp;; 
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

### ⚪️ 4.  Add some randomness to unique fields

🏷&nbsp; **Tags:** `#advanced, strategic, #draft`

:white_check_mark:  **Do:** Given information that must be unique like username or email, the test should combine meaningul data with some randomness to avoid collission with other tests. A test should assume nothing on other tests neither should the writer read previous tests implementation. Rosie or timestamp

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

### ⚪️ 5.  Test types when the value is unknown

🏷&nbsp; **Tags:** `#basic, #draft`gg

:white_check_mark:  **Do:** Sometime the response contains important fields with dynamic data, like a date or incrementing number. Can't check specific value but still it's important to ensure that the right thing was returned - Check not only that the field is not null rather have the right type. Jest and Sinon allows checking entire objects schema.

<br/>

👀 &nbsp; **Alternatives:** Not null  ❌ &nbsp; 
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

### ⚪️ 6.  Record real requests for awareness

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

<br/>


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
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTIwMTExMDgwNSwtMjAxMzY1MjkyOSwtMj
E0MjU3NDQ0NywxNjM4NTUyOTk4LC03NDU0MTA3NSwxMTYzNTQx
NTQ5LDEzMDE2OTEwNDAsOTI1MzAwMzk1LDE2Njg1MjE3NzIsOD
A0OTMwOTY4LC0xOTY4NzM3ODE1LDEyMjU4MzgwMTQsMTIwNDQ5
NjcyLDEyNjQwNzY1MzYsLTYwNTQ4NTk5LC0xNDk5Njg1MzA5LD
EzMDc2MzI3MjAsMTU4MjYxMzkxNCwtMTYxNTY3OTEwMCwtNTkx
MjQwNjc4XX0=
-->