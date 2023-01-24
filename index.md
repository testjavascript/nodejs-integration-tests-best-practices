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

## 👽 The 'mystery exception visitor' test - when an uncaught exception meets our code

**👉What & why -** A typical error flow test falsely assumes two conditions: A valid error object was thrown, and it was caught. Neither is guaranteed, let's focus on the 2nd assumption: it's common for certain errors to left uncaught. The error might get thrown before your framework error handler is ready, some npm libraries can throw surprisingly from different stacks using timer functions, or you just forget to set someEventEmitter.on('error', ...). To name a few examples. These errors will find their way to the global process.on('uncaughtexception') handler, **hopefully if your code subscribed**. How do you simulate this scenario in a test? naively you may locate a code area that is not wrapped with try-catch and stub it to throw during the test. But here's a catch22: if you are familiar with such area - you are likely to fix it and ensure its errors are caught. What do we do then? we can bring to our benefit the fact the JavaScript is borderless, if some object can emit an event, we as its subscribers can make it emit this event ourselves, here's an example:

researches says that, rejection

Naive, better, enrich (so what, sexy visuals, link (social proof), numbers, advanced)

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

## 🔨 The 'overdoing' test - when the code mutates too much

**👉What & why -** The thing with tests that deal with database is they focus on specific records, ignore effects to other records. This can be really bad, here's a story

On top of your tests, write tests that check. Here is a nice trick that I was taught by Gil Tayar - when testing for...

**📝 Code**

```javascript

```

## 🕵🏼 The 'hidden effect' test - when the code should not mutate at all

**👉What & why -** A typical naive test is checking the API response as the source of the truth. Do you really believe this actor that much? Consider a test with validation, most check 400 response.

**📝 Code**

```javascript

```

## 🕰 The 'slow collaborator' test - when the other service times out

**👉What & why -** Do you know what happen when is slow? when it times out? what can I do? if important - retry, back-off, at the bare minimum log and metric. How do you simulate this without making your tests too slow?

Ideas: two versions, use this to simulate

**📝 Code**

```javascript

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

• Packaged lib #write
