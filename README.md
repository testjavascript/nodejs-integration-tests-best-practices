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

:white_check_mark:  **Do:** On the performance gain while keeping up in dev environment, what about cleaning data (other bullet), show numbers, an emotional sentence why it's so fun to get feedback while writing. CI is the same, just cold start

<br/>


👀 &nbsp; **Alternatives:** Re-start anytime ❌;   

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

### ⚪️ 4. Optimize your real DB for testing, Don't fake it

🏷&nbsp; **Tags:** `#performance, #draft`

:white_check_mark:  **Do:** Avoid fake DBs, it brings noise, loosen the DB durability settings to gain performance boost, for example {something}, show numbers,


<br/>


👀 &nbsp; **Alternatives:** Use SQLite which is actually slower ❌;  no optimizations

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

### ⚪️ 5. Store test data in RAM folder

🏷&nbsp; **Tags:** `#performance, #draft`

:white_check_mark:  **Do:** Minor boost, harder in Mac, easier in Linux using tmpfs, some DB has a built-in memory engine which you may consider because

<br/>

👀 &nbsp; **Alternatives:** Use SQLite which is actually slower ❌;  no optimizations

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

### ⚪️ 6. Build the DB schema using migrations, ensure it happens only once in dev

🏷&nbsp; **Tags:** `#performance, #draft`

:white_check_mark:  **Do:** While there are various way to build the DB tables, the technique that is used in production is always preferred.

As part of initializing the DB (via docker-compose) run the data migration. Since this is a time consuming operation - Run this only in CI or if an explicit environment variable was specified. To allow developers to migrate in a development environment, create a dedicated test command which includes the environment variable flag

Use npm script for this, migration is like the production mechanism. Use this for metadata only, see the bullet 'Each test act on dedicated DB rows'

<br/>

👀 &nbsp; **Alternatives:** Use ORM sync - Important piece, migration, is left untested ❌;  Migrate all the time with local disc check (without DB call)

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


## **Section: Isolating from the external world**

<br/>

### ⚪️ 1.  Isolate the component from the world using HTTP interceptor

🏷&nbsp; **Tags:** `#strategic #basic, #draft`

:white_check_mark:  **Do:** On the existence of collaborator services, they make high impact on logic and resilliency. We want to simulate all the complexity they bring without paying the price (slow, noisy, hard to reproduce). We can put a util that fakes the response, it works by replacing node's http client. In any case, don't allow calls outside, 

Goes against the Microservice idea, not big bang

Analogue - Simulator, like fighting combats - Practice the outside conditions without the damage

Downside - What if they changed...

<br/>

👀 &nbsp; **Alternatives:** Fake servers, out of process, hard to set during the test &nbsp; ❌; Sandbox environments &nbsp; ❌;
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

### ⚪️ 2.  Define default responses before every test to ensure a clean slate

🏷&nbsp; **Tags:** `#basic, #draft`

:white_check_mark:  **Do:** What are global default responses, define in beforeEach, cleanup in afterEach. This ensure that if something was overriden, the next test doesn't suffer. One place to see all defaults.

Downside: performance penalty, we measured 1ms. 

How to override, see bullet...

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

🏷&nbsp; **Tags:** `#basic, #draft`

:white_check_mark:  **Do:** Having all nocks defined doesn't guarantee, protect our borders. The nock.enableNetConnect() command, remember to include localhost + port, remember to clean-up

<br/>

👀 &nbsp; **Alternatives:** Trust your work, anyway likely to fail, but why  ❌ &nbsp; 

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

🏷&nbsp; **Tags:** `#basic, #draft`

:white_check_mark:  **Do:** There is happy path, unhappy paths and true chaos. Cover all. Both non-trivial responses like customer doesn't exist, also no-response (timeout), delayed response. If you have a circuit-breaker than you may test it only and exclude thest tests from every route. 

<br/>

👀 &nbsp; **Alternatives:** Avoid testing this will result in unneccessary failures  ❌ &nbsp; ; 
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
eyJoaXN0b3J5IjpbLTE3NTk3NDA1NzYsLTIwNjE1MzMwNDMsMT
EwMjI0MzcxMSwxMDA3NzQyMjYxLDExNTU3MTAwNjgsLTE1NTY2
Nzk0OTAsLTEwMzQxODU1MDAsMTEzMjMwNjkxOSwtMTgwMzY2Mz
U4NiwxMzQxMTc3ODY2LDExMjUyOTY5NDgsLTc4Njk2Nzc4OSwx
NDQxMTc3Mzg3LDE3MzE3MDYwMzYsLTQ4MTA1ODcxNCwtOTQ5Mj
Q2MTAxLDIwMTE3MDI0MzMsLTE1ODAxNTAzNTIsLTE1Mjc3NzI0
MDcsNjAyNTc3OTMwXX0=
-->