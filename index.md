# Important backend tests that you're probably not writing enough

## Only 3 sentences before we start

Some intro words here, a demonstration of component tests power, 5-8 statements, fast, and much closer to production, my course, happens to 99% of apps

The code under test is about

## 🧟‍♀️ The zombie process test

**👉What & so what? -** In all of your tests, you assume that the app has already started successfully, lacking a test against the initialization flow. This is a pity because dead bodies are covered in this phase. First, initialization failures are frequent - many bad things can happen here, like a DB connection failure or a new version that crashes in production. For this reason, runtime platforms (like Kubernetes and others) encourage components to signal when they are ready (see [readiness probe](https://komodor.com/learn/kubernetes-readiness-probes-a-practical-guide/#:~:text=A%20readiness%20probe%20allows%20Kubernetes,on%20deletion%20of%20a%20pod.)). Errors at this stage also have a dramatic effect over the app health - if the initialization fails and the process stays alive, it becomes a 'zombie process'. In this scenario, the runtime platform won't realize that something went bad, forward traffic to it and avoid creating alternative instances. Besides exiting gracefully, you may want to consider logging, firing a metric, and adjusting your /readiness route. Does it work? only test can tell!

**📝 Code**

Code under test, api.js:

```javascript
// A common express server initialization
const startWebServer = () => {
  return new Promise((resolve, reject) => {
    try {
      // A typical Express setup
      expressApp = express();
      defineRoutes(expressApp); // a function that defines all routes
      connection = expressApp.listen(process.env.WEB_SERVER_PORT, () => {
        resolve(connection.address());
      });
    } catch (error) {
      //log here, fire a metric, maybe even retry and finally:
      process.exit();
    }
  });
};
```

The test:

```javascript
const api = require('./entry-points/api'); // our api starter that exposes 'startWebServer' function
const sinon = require('sinon'); // a mocking library

test('When an error happens during the startup phase, then the process exits', async () => {
  // Arrange
  const processExitListener = sinon.stub(process, 'exit');
  // 👇 Choose a function that is part of the initialization phase and make it fail
  sinon
    .stub(routes, 'defineRoutes')
    .throws(new Error('Cant initialize connection'));

  // Act
  await api.startWebServer();

  // Assert
  expect(processExitListener.called).toBe(true);
});
```

## 👀 The observability test

**👉What & why -** For many, testing error means checking the exception type or the API response. This leaves one of the most essential parts uncovered - making the error **correctly observable**. In plain words, ensuring that it's being logged correctly and exposed to the monitoring system. It might sound like an internal thing, implementation testing, but actually, it goes directly to a user. Yes, not the end-user, but rather another important one - the ops user who is on-call. What are the expectations of this user? At the very basic level, when a production issue arises, she must see detailed log entries, including stack trace, cause and other properties. This info can save the day when dealing with production incidents. On to of this, in many systemss, monitoring is managed separately to conclude about the overall system state using cumulative heuristics (e.g., an increase in the number of errors over the last 3 hours). To support this monitoring needs, the code also must fire error metrics. Even tests that do try to cover these needs take a naive approach by checking that the logger function was called - but hey, does it include the right data? Some write better tests that check the error type that was passed to the logger, good enough? No! The ops user doesn't care about the JavaScript class names but the JSON data that is sent out. The following test focuses on the specific properties that are being made observable:

**📝 Code**

```javascript
test('When exception is throw during request, Then logger reports the mandatory fields', async () => {
  //Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };
  const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');
  sinon
    .stub(OrderRepository.prototype, 'addOrder')
    .rejects(new AppError('saving-failed', 'Order could not be saved', 500));
  const loggerDouble = sinon.stub(logger, 'error');

  //Act
  await axiosAPIClient.post('/order', orderToAdd);

  //Assert
  expect(loggerDouble.lastCall.firstArg).toMatchObject({
    name: 'saving-failed',
    status: 500,
    stack: expect.any(String),
    message: expect.any(String),
  });
  expect(
    metricsExporterDouble.calledWith('error', {
      errorName: 'example-error',
    })
  ).toBe(true);
});
```

## 👽 The 'unexpected visitor' test - when an uncaught exception meets our code

**👉What & why -** A typical error flow test falsely assumes two conditions: A valid error object was thrown, and it was caught. Neither is guaranteed, let's focus on the 2nd assumption: it's common for certain errors to left uncaught. The error might get thrown before your framework error handler is ready, some npm libraries can throw surprisingly from different stacks using timer functions, or you just forget to set someEventEmitter.on('error', ...). To name a few examples. These errors will find their way to the global process.on('uncaughtException') handler, **hopefully if your code subscribed**. How do you simulate this scenario in a test? naively you may locate a code area that is not wrapped with try-catch and stub it to throw during the test. But here's a catch22: if you are familiar with such area - you are likely to fix it and ensure its errors are caught. What do we do then? we can bring to our benefit the fact the JavaScript is borderless, if some object can emit an event, we as its subscribers can make it emit this event ourselves, here's an example:

researches says that, rejection

**📝 Code**

```javascript
test('When an unhandled exception is thrown, then process stays alive and the error is logged', async () => {
  //Arrange
  const loggerDouble = sinon.stub(logger, 'error');
  const processExitListener = sinon.stub(process, 'exit');
  const errorToThrow = new Error('An error that wont be caught 😳');

  //Act
  process.emit('uncaughtException', errorToThrow); //👈 Where the magic is

  // Assert
  expect(processExitListener.called).toBe(false);
  expect(loggerDouble.lastCall.firstArg).toMatchObject(errorToThrow);
});
```

## 🕵🏼 The 'hidden effect' test - when the code should not mutate at all

**👉What & so what -** In common scenarios, the code under test should stop early like when the incoming payload is invalid or a user doesn't have sufficient credits to perform an operation. In these cases, no DB records should be mutated. Most tests out there in the wild settle with testing the HTTP response only - got back HTTP 400? great, the validation/authorization probably work. Or does it? The test trusts the code too much, a valid response doesn't guarantee that the code behind behaved as design. Maybe a new record was added although the user has no permissions? Clearly you need to test this, but how would you test that a record was NOT added? There are two options here: If the DB is purged before/after every test, than just try to perform an invalid operation and check that the DB is empty afterward. If you're not cleaning the DB often (like me, but that's another discussion), the payload must contain some unique and queryable value that you can query later and hope to get no records. This is how it looks like:

**📝 Code**

```javascript
it('When adding an invalid order, then it returns 400 and NOT retrievable', async () => {
  //Arrange
  const orderToAdd = {
    userId: 1,
    mode: 'draft',
    externalIdentifier: uuid(), //no existing record has this value
  };

  //Act
  const { status: addingHTTPStatus } = await axiosAPIClient.post(
    '/order',
    orderToAdd
  );

  //Assert
  const { status: fetchingHTTPStatus } = await axiosAPIClient.get(
    `/order/externalIdentifier/${orderToAdd.externalIdentifier}`
  ); // Trying to get the order that should have failed
  expect({ addingHTTPStatus, fetchingHTTPStatus }).toMatchObject({
    addingHTTPStatus: 400,
    fetchingHTTPStatus: 404,
  });
  // 👆 Check that no such record exists
});
```

## 🧨 The 'overdoing' test - when the code should mutate but it's doing too much

**👉What & why -** This is how a typical data-oriented test looks like: first you add some records, then approach the code under test, and finally assert what happens to these specific records. So far, so good. There is one caveat here though: since the test narrows it focus to specific records, it ignores whether other record were unnecessarily affected. This can be really bad, here's a short real-life story that happened to my customer: Some data access code changed and incorporated a bug that updates ALL the system users instead of just one. All test pass since they focused on a specific record which positively updated, they just ignored the others. How would you test and prevent? here is a nice trick that I was taught by my friend Gil Tayar: in the first phase of the test, besides the main records, add one or more 'control' records that should not get mutated during the test. Then, run the code under test, and besides the main assertion, check also that the control records were not affected:

**📝 Code**

```javascript
test('When deleting an existing order, Then it should NOT be retrievable', async () => {
  // Arrange
  const orderToDelete = {
    userId: 1,
    productId: 2,
  };
  const deletedOrder = (await axiosAPIClient.post('/order', orderToDelete)).data
    .id; // We will delete this soon
  const orderNotToBeDeleted = orderToDelete;
  const notDeletedOrder = (
    await axiosAPIClient.post('/order', orderNotToBeDeleted)
  ).data.id; // We will not delete this

  // Act
  await axiosAPIClient.delete(`/order/${deletedOrder}`);

  // Assert
  const { status: getDeletedOrderStatus } = await axiosAPIClient.get(
    `/order/${deletedOrder}`
  );
  const { status: getNotDeletedOrderStatus } = await axiosAPIClient.get(
    `/order/${notDeletedOrder}`
  );
  expect(getNotDeletedOrderStatus).toBe(200);
  expect(getDeletedOrderStatus).toBe(404);
});
```

## 🕰 The 'slow collaborator' test - when the other HTTP service times out

**👉What & why -** When your code approaches other services/microservices via HTTP, savvy testers minimize end-to-end tests because they lean toward happy paths (it's harder to simulate scenarios). This mandates using some mocking tool to act like the remote service, for example, using tools like [nock](https://github.com/nock/nock) or [wiremock](https://wiremock.org/). These tools are great, only some are using them naively and check mainly that calls outside were indeed made. What if the other service is not available **in production**, what if it is slower and times out occasionally? While you can't wholly save this transaction, your code should do the best given the situation and retry, or at least log and return the right status to the caller. All the network mocking tools allow simulating delays, timeouts and other 'chaotic' scenarios. Question left is how to simulate slow response without having slow tests? You may use [fake timers](https://sinonjs.org/releases/latest/fake-timers/) and trick the system into believing as few seconds passed in a single tick. If you're using [nock](https://github.com/nock/nock), it offers an interesting feature to simulate timeouts **quickly**: the .delay function simulates slow responses, then nock will realize immediately if the delay is higher than the HTTP client timeout and throw a timeout event immediately without waiting

**📝 Code**

```javascript
// In this example, our code accepts new Orders and while processing them approaches the Users Microservice
test('When users service times out, then return 503 (option 1 with fake timers)', async () => {
  //Arrange
  const clock = sinon.useFakeTimers();
  config.HTTPCallTimeout = 1000; // Set a timeout for outgoing HTTP calls
  nock(`${config.userServiceURL}/user/`)
    .get('/1', () => clock.tick(2000)) // Reply delay is bigger than configured timeout
    .reply(200);
  const loggerDouble = sinon.stub(logger, 'error');
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };

  //Act
  // 👇try to add new order which should fail due to User service not available
  const response = await axiosAPIClient.post('/order', orderToAdd);

  //Assert
  // 👇At least our code does its best given this situation
  expect(response.status).toBe(503);
  expect(loggerDouble.lastCall.firstArg).toMatchObject({
    name: 'user-service-not-available',
    stack: expect.any(String),
    message: expect.any(String),
  });
});
```

## 💊 The 'poisoned message' test - when the message consumer gets an invalid payload that might put it in stagnation

**👉What & why -** Unlike HTTP, in MQ - not rejecting messages correctly can result in paralyzed consumer. This is why this syndrome is called 'poisoned message'. To cover, we need to test all the pieces, not just the logic but working with real MQ is flaky. My advice here is to work with a fake (example) and wrap it with a promise that tells when things happen. This will spare quirky techniques like polling, callbacks, huge timeouts. Simply put, inject in your message queue client code a 'waitFor(eventName, howManyTimes) : Promise<EventInfo>' which will tell the test when things are done. Here is a full example of such a fake queue using RabbitMQ.

**📝 Code**

```javascript

```

## 🗞 The 'false envelope' test - when the caller provides an invalid JWT token (not easy to test!)

**👉What & why -** Use real, if your components holds private - let the test sign. Things become more interesting when using Asymmetric JWT where test no access to sign, it grabs the public key (used for verification) for the token issuer. The returned public key typically comes in the form of JWKS. If you stub this code out, bad. Keep it in, just fake the network response with your own public key

Ideas: ?

**📝 Code**

```javascript

```

## 🗞 The 'misleading docs' test - when the code is great but its corresponding OpenAPI docs leads to a production bug

**👉What & why -** Wrong docs can lead not only to users frustration but also to a production bug. Here is an example: Removed the field, deletionDate, forgot to update its OpenAPI, the client tries to base some logic on this field and BOOM -> production bug. While there are some fancy techniques like contract, some leaner options exist to cover this easily. Jest-openapi and mocha-openapi are solving this in a fantastic approach. They listen to the network and when a response bounces in, they validate they payload against the OpenAPI docs - if there is a mismatch they will fail

Ideas: Can't verify, always manual, failure image

**📝 Code**

```javascript

```

## Ideas

Reach all the corners
Unlike unit and E2E
Level-up - provide more examples

• Packaged lib #write
