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

## 👽 The 'stranger in town' exceptions test

**👉What & why -** Naively, many mostly tests errors that they are expecting for and caught. BUT... In reality, researches says that. 3rd party libs

**📝 Code**

```javascript
test('When exception is throw during request, Then a metric is fired', async () => {
  //Arrange
  const orderToAdd = {
    userId: 1,
    productId: 2,
    mode: 'approved',
  };

  const errorToThrow = new AppError(
    'example-error',
    'some example message',
    500
  );
  sinon.stub(OrderRepository.prototype, 'addOrder').throws(errorToThrow);
  const metricsExporterDouble = sinon.stub(metricsExporter, 'fireMetric');

  //Act
  await axiosAPIClient.post('/order', orderToAdd);

  //Assert
  expect(
    metricsExporterDouble.calledWith('error', {
      errorName: 'example-error',
    })
  ).toBe(true);
});
```

## 👀 The observability test

**👉What & why -** When some bad things happen, make them visible is the best we can, this can save the day, and it might not happen until we test it. Observable here stands for logging+metrics.

Other idea? what is worth than the ops person noticing bad things happening in production? bad things happening in production without a notice

There are also naive implementation of these tests - only log, no properties, check the type,

**📝 Code**

```javascript

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
