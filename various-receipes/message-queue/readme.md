# Testing with message queues

## Intro

Sometimes the message queues are just on obstacle to overcome, for exmaple when one wishes to focus on the flow that starts with a message from a queue. In other cases, the MQ behaviour is the focus of the test like when trying to ensure that too much failures will put the message in a queue

There are two fundamentally different ways to approach this, by stubbing the message queue client or by using a real/fake message queue server in Docker:

|                                          | Real message queue | Stub |
|------------------------------------------|--------------------|------|
| Discover a bug in the client lib         | 👍🏼                 | 😢    |
| Test that a message was tried to be sent | 👍🏼                 | 👍🏼   |
| Speed                                    | 👍🏼                 | 😐    |
| Test a flow that starts with a message   | 👍🏼                 | 👍🏼   |
| Test arrival to dead-letter-queue        | 😐                  | 👍🏼   |
| Test a poisoned message                  | 👍🏼                 | 👍🏼   |