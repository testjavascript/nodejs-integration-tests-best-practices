![Header](/graphics/main-header-v2.jpg "Component Tests")

<br/>

## Master the art of the most powerful technique for testing modern backend

The name is an homage to the legendary first ever testing book ['The Art Of Software Testing' by Glenford Myers'](https://www.amazon.com/Art-Software-Testing-Glenford-Myers/dp/1118031962#ace-g9766277718)

`Note: Work in progress, to be released in 01/2021`

<br/>

# Intro

This repo shows the immense power of narrow integration tests, also known as 'component test', including examples and how to set them up properly. This might make a huge impact on your testing effort and success 🚀

![Header](/graphics/component-diagram.jpg "Component Tests")

<br/><br/><br/>

# Why is this so important

The testing world is moving from pyramids to diamonds, more emphasis is being put on integration tests and for good reasons. Here to put reasons to move toward more integration tests

<br/><br/><br/>

# What can you find here?

This repo provides the following benefits and assets:

1. 📊 Example application - Complete showcase of a typical Microservice with tests setup and the test themselves
2. 🦶Step by step guide - Detailed instructions on how to setup your intergation test environment and write tests according to best practices
3. 🚀 Advanced stuff - How to take this technique to the next level and maximize your invest. This includes beyond the basics techniques like store your DB data in a fast RAM folder, detect memory leaks during tests, testing data migrations, contract tests and more

<br/><br/><br/>

# Example application

Some details on the example applications and link to the folder

<br/><br/><br/>

# Step by step guide to get up to speed

<br/>

## Part 1: Web server setup

<br/>

## ⚪️ 1. Place a start and stop method within your app entry point

:white_check_mark: **Do:**
For proper startup and teardown, the app entry point (e.g. webserver start code) must expose for the testing a start and stop methods that will initialize and teardown all resources. The tests will use these methods to initialize the app (e.g. API, MQ) and clean-up when done

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources but then with frequent testing many connections will leak and might choke the machine

<br/>

<details><summary>✏ <b>Code Examples</b></summary>
  
  https://github.com/testjavascript/integration-tests-a-z/blob/4c76cb2e2202e6c1184d1659bf1a2843db3044e4/example-application/api-under-test.js#L10-L34

</details>

<br/><br/>

## ⚪️ 2. Specify a specific port only in production

:white_check_mark:  **Do:**
Let the web server randomize a port in testing to allow multiple processes and instances. Specifying a specific port in testing will prevent two testing processes from running at the same time. In production, specify a specific port in an environment variable and use it. In testing, specify no port. 

<br/>

👀  **Alternatives:**
You may initialize one webserver in a dedicated processes, but then the tests and API under test won't be on the same process and many features like coverage and test doubles won't be feasible

<br/>


<details><summary>✏ <b>Code Examples</b></summary>

```


```

</details>

<br/><br/>

## ⚪️ 3. Define infrastructure in a docker-compose file

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

## ⚪️ 4. Start docker-compose in a global setup process

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

## ⚪️ 5. Teardown the DB only in a CI environment

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

## ⚪️ 6. Run migrations only if needed

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

## ⚪️ 7. Initialize the app within the beforeAll hook

:white_check_mark:  **Do:**
Within each test file, initialize the app and the webserver inside the beforeAll hook (In mocha this is called 'before'). Ensure to await for its readiness so the tests won't try to approach when the server is not ready to accept connections

<br/>

👀  **Alternatives:**
-

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/basic-tests.js#L14-L22
</details>

<br/><br/>

## ⚪️ 7. Teardown the app within the afterAll hook

:white_check_mark:  **Do:**
Within each test file, close the app and the webserver inside the afterAll hook (In mocha this is called 'after')

<br/>

👀  **Alternatives:**
-

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/basic-tests.js#L24-L28
</details>

<br/><br/>

## ⚪️ 8. Isolate the component from the world

:white_check_mark:  **Do:**
Intercept all calls to extraneous services and provide a default sensible result. Use the library nock for this matter. Consider raising an exception anytime an unknown HTTP call was made

<br/>

👀  **Alternatives:**
- 

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
https://github.com/testjavascript/integration-tests-a-z/blob/06c02a4b56b07fd08f1fc42e67404de290856d3b/example-application/test/basic-tests.js#L24-L28
</details>

<br/><br/>

# Advanced techniques

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
- Open the file ./src/tests/basic-tests
- Follow the code and best practices inside
- Move to more advanced use cases in ./src/tests/
```
