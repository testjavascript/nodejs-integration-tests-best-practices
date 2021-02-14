# Testing with message queues

## Intro

Sometimes the message queues are just on obstacle to overcome, for exmaple when one wishes to focus on the flow that starts with a message from a queue. In other cases, the MQ behaviour is the focus of the test like when trying to ensure that too much failures will put the message in a queue

There are two fundamentally different ways to approach this, by stubbing the message queue client or by using a real/fake message queue server in Docker:
| | Real Message Queue System | Stub the client | Fake Message Queue System |
|------------------------------------------ |------------------------------------------------------------------------------------------------ |---------------------------------------------------------------------------------- |-------------------------------------------------------------------------------------- |
| **Option description** | Put real MQ in Docker: publish to real queues, read from real queues | No MQ system: Replace the consume and publish methods and listen to their usage | Fake MQ for testing: Expose identical interface and simulate the behaviour of MQ |
| Confidence | ☀️ <br/> (Test the driver and full flows including retry, dlq, etc) | 🌦️ <br/> (Hard to test outcomes like rejection) | 🌥️ <br/> (Allows testing all signals to the MQ, but not the entire flow message flow) |
| Execution speed | 🌦️ | ☀️ | ☀️ |
| Flakiness | 🌥️ <br/> (For example, a test might assume a fresh queue but messages were left from previous) | ☀️ <br/> (Nothing leaks between tests, very deterministic) | ☀️ <br/> (Nothing leaks between tests, very deterministic) |
| Simplicity | ☀️ <br/> (Just like production) | ☀️ (Stop before it even reaches to the rabbit hole) | 🌥️ (Need to maintain a thing that behaves like MQ) |
| | | | |
| Discover a bug in the client lib | 👍🏼 | 😢 | |
| Test that a message was tried to be sent | 👍🏼 | 👍🏼 | |
| Speed | 👍🏼 | 😐 | |
| Test a flow that starts with a message | 👍🏼 | 👍🏼 | |
| Test arrival to dead-letter-queue | 😐 | 👍🏼 | |
| Test a poisoned message | 👍🏼 | 👍🏼 | |
