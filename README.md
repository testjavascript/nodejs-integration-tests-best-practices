![Header](/images-for-readme/main-header.jpg "Component Tests")

<br/>

## Master the art of the most powerful technique for testing modern backend

The name is an homage to the legendary first ever testing book ['The Art Of Software Testing' by Glenford Myers'](https://www.amazon.com/Art-Software-Testing-Glenford-Myers/dp/1118031962#ace-g9766277718)

`Note: Work in progress, to be released in 11/2020`

<br/>

# Intro

This repo shows the immense power of narrow integration tests, also known as 'component test', including examples and how to set them up properly. This might make a huge impact on your testing effort and success 🚀

![Header](/images-for-readme/component-diagram.jpg "Component Tests")

<br/><br/><br/>

# Why is this so important

The testing world is moving from pyramids to diamonds, more emphasis is being put on integration tests and for good reasons. Here to put reasons to move toward more integration tests

<br/><br/><br/>

# What can you find here?

This repo provides the following benefits and assets:

1. 📊 Example application - Complete showcase of a typical Microservice with tests setup and the test themselves
2. 🦶Step by step guide - Detailed instructions on how to setup your intergation test environment and write tests according to best practices
2. 🚀 Advanced stuff - How to take this technique to the next level and maximize your invest. This includes beyond the basics techniques like store your DB data in a fast RAM folder, detect memory leaks during tests, testing data migrations, contract tests and more

<br/><br/><br/>

# Example application

Some details on the example applications and link to the folder


<br/><br/><br/>

# Step by step guide to get up to speed

<br/>

## Part 1: Web server setup

<br/><br/>

## ⚪️ 1. Place a start and stop method within your app

:white_check_mark: **Do:**
For proper teardown, the app must expose for the testing a start and stop methods that will initialize and teardown all resources

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources but then with frequent testing many connections will leak and might choke the machine

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
  
  ```
  //my-app.js
  function start(){
  }
  

  function stop(){
  }
  
  ```

</details>

<br/><br/>

## ⚪️ 2. Don't specify a port

:white_check_mark: **Do:**
For proper teardown, the app must expose for the testing a start and stop methods that will initialize and teardown all resources

<br/>

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources but then with frequent testing many connections will leak and might choke the machine

<br/>


<details><summary>✏ <b>Code Examples</b></summary>
  
  ```
  //my-app.js
  function start(){
  }
  

  function stop(){
  }
  
  ```

</details>

<br/><br/>

# Step by step guide to get up to speed

## Part 2: Database setup

<br/>

## ⚪️ 1. Place a start and stop method within your app

:white_check_mark: **Do:**
For proper teardown, the app must expose for the testing a start and stop methods that will initialize and teardown all resources

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources but then with frequent testing many connections will leak and might choke the machine


<details><summary>✏ <b>Code Examples</b></summary>
  
  ```
  //my-app.js
  function start(){
  }
  

  function stop(){
  }
  
  ```

</details>

## ⚪️ 2. Don't specify a port

:white_check_mark: **Do:**
For proper teardown, the app must expose for the testing a start and stop methods that will initialize and teardown all resources

👀 **Alternatives:**
The application under test can avoid opening connections and delegate this to the test, however this will make a change between production and test code. Alternativelly, one can just let the test runner kill the resources but then with frequent testing many connections will leak and might choke the machine


<details><summary>✏ <b>Code Examples</b></summary>
  
  ```
  //my-app.js
  function start(){
  }
  

  function stop(){
  }
  
  ```

</details>

<br/><br/>

<br/><br/><br/>

# Advanced techniques

<br/><br/><br/>

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


