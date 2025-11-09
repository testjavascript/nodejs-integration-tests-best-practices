---
applyTo: '**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts,__tests__/**/*.js,__tests__/**/*.ts,test/**/*.js,test/**/*.ts'
source: https://github.com/lirantal/agent-rules
---

# Testing Guidelines for Node.js applications

This document outlines the rules and guidelines for AI agents generating test code for modern Node.js applications.

The following are project tests code standards, principles and strategy for for JavaScript and TypeScript projects that you should apply and follow if you are working on a task related to writing tests, updating existing tests, or overall refactoring and making changes to test code.

## General Testing Principles

### Guiding Principles

1.  **Modern Node.js:** All test code must be compatible with Node.js version 22 and above.
2.  **Latest JavaScript:** Utilize the latest JavaScript features (ES2022 and beyond), including top-level `await` and modern syntax.
3.  **Built-in Tools:** Exclusively use the built-in Node.js test runner (`node:test`) and assertion library (`node:assert`). No third-party testing frameworks (e.g., Jest, Mocha, Chai) should be used.
4.  **ES Modules:** All code should be written using ES Modules (`import`/`export`). CommonJS (`require`) should be avoided.
5.  **Asynchronous Focus:** Tests should be written with an `async`-first mindset, effectively handling promises and asynchronous operations.
6.  **Clarity and Readability:** Tests should be easy to understand. Use descriptive names for `describe` blocks and `test` cases.

### Descriptive Test Naming (Three-Part Structure)

A well-named test clearly communicates its purpose, making test reports more informative and debugging easier for anyone, regardless of their familiarity with the codebase. Adopt a three-part structure for your test names:

1.  **What is being tested?** (The unit under test, e.g., `ProductsService.addNewProduct`)
2.  **Under what circumstances/scenario?** (The specific conditions, e.g., `no price is passed to the method`)
3.  **What is the expected result?** (The outcome, e.g., `the new product is not approved`)

This structure ensures that a failing test immediately tells you _what_ broke, _when_ it broke, and _what the expected behavior was_.

**Example:**

```javascript
// 1. unit under test
describe('Products Service', function () {
  describe('Add new product', function () {
    // 2. scenario and 3. expectation
    it('When no price is specified, then the product status is pending approval', () => {
      const newProduct = new ProductService().add();
      assert.strictEqual(newProduct.status, 'pendingApproval');
    });
  });
});
```

**Avoid:** Test names like "Add product" which provide insufficient information upon failure.

### Structure Tests by the AAA Pattern

To ensure clarity and maintainability, structure your tests using the Arrange, Act, and Assert (AAA) pattern. This pattern divides each test into three distinct, well-separated sections, making the test's purpose and flow immediately clear to anyone reading it:

1.  **Arrange:** This section includes all the setup code necessary to bring the system to the specific scenario the test aims to simulate. This might involve instantiating the unit under test, setting up initial data (e.g., adding database records), or configuring mocks/stubs on dependencies. The goal is to prepare everything needed for the action.

2.  **Act:** This is where you execute the unit under test. Typically, this involves a single line of code that invokes the method or function being tested.

3.  **Assert:** In this final section, you verify that the outcome of the 'Act' phase matches your expectations. This usually involves one or more assertion statements that check the return value, the state of the system, or interactions with mocked dependencies.

Following the AAA pattern reduces cognitive load when reading tests, making them easier to understand, debug, and maintain.

**Example:**

```javascript
describe('Customer classifier', () => {
  test('When customer spent more than 500$, should be classified as premium', (t) => {
    // Arrange
    const customerToClassify = { spent: 505, joined: new Date(), id: 1 };
    const dataAccess = { getCustomer: () => {} }; // Mock object for demonstration
    t.mock.method(dataAccess, 'getCustomer', () => ({
      id: 1,
      classification: 'regular',
    }));
    const customerClassifier = {
      classifyCustomer: (customer) => {
        if (customer.spent > 500) return 'premium';
        return 'regular';
      },
    };

    // Act
    const receivedClassification =
      customerClassifier.classifyCustomer(customerToClassify);

    // Assert
    assert.strictEqual(receivedClassification, 'premium');
  });
});
```

### Describe Expectations in a Product Language (BDD-style Assertions)

Writing tests in a declarative style, often referred to as Behavior-Driven Development (BDD) style, makes them highly readable and immediately understandable. The goal is to express expectations in a human-like language, avoiding complex conditional logic within assertions.

While `node:assert` is more imperative than some third-party assertion libraries, you can still strive for clarity by combining assertions and using helper functions where appropriate to make the intent explicit.

**Example:**

```javascript
it('When asking for an admin, ensure only ordered admins in results', () => {
  // Arrange
  const getUsers = ({ adminOnly }) => {
    const users = ['admin1', 'user1', 'admin2'];
    if (adminOnly) {
      return users.filter((user) => user.startsWith('admin')).sort();
    }
    return users;
  };

  // Act
  const allAdmins = getUsers({ adminOnly: true });

  // Assert
  // Using a combination of assertions to achieve a BDD-like clarity
  assert.deepStrictEqual(
    allAdmins,
    ['admin1', 'admin2'],
    'Should include ordered admins',
  );
  assert.ok(!allAdmins.includes('user1'), 'Should not include regular users');
});
```

### Describe Expectations in a Product Language (BDD-style Assertions)

Writing tests in a declarative style, often referred to as Behavior-Driven Development (BDD) style, makes them highly readable and immediately understandable. The goal is to express expectations in a human-like language, avoiding complex conditional logic within assertions.

While `node:assert` is more imperative than some third-party assertion libraries, you can still strive for clarity by combining assertions and using helper functions where appropriate to make the intent explicit.

**Example:**

```javascript
it('When asking for an admin, ensure only ordered admins in results', () => {
  // Arrange
  const getUsers = ({ adminOnly }) => {
    const users = ['admin1', 'user1', 'admin2'];
    if (adminOnly) {
      return users.filter((user) => user.startsWith('admin')).sort();
    }
    return users;
  };

  // Act
  const allAdmins = getUsers({ adminOnly: true });

  // Assert
  // Using a combination of assertions to achieve a BDD-like clarity
  assert.deepStrictEqual(
    allAdmins,
    ['admin1', 'admin2'],
    'Should include ordered admins',
  );
  assert.ok(!allAdmins.includes('user1'), 'Should not include regular users');
});
```

### Categorize Tests Under at Least 2 Levels

To improve the readability, navigation, and reporting of your test suite, it's highly recommended to categorize your tests using at least two levels of `describe` blocks. This structure helps an occasional visitor quickly understand the requirements (as tests serve as excellent documentation) and the various scenarios being tested.

A common approach is to use the first `describe` block for the name of the unit under test and the second `describe` block for an additional level of categorization, such as a specific scenario or custom categories. This practice significantly enhances test reports, allowing readers to easily infer test categories, delve into desired sections, and correlate failing tests with specific functionalities. It also makes it much easier for developers to navigate through the code of a test suite with many tests.

**Example:**

```javascript
// Unit under test
describe('Transfer service', () => {
  // Scenario
  describe('When no credit', () => {
    // Expectation
    test('Then the response status should decline', () => {
      // Test implementation here
    });

    // Expectation
    test('Then it should send email to admin', () => {
      // Test implementation here
    });
  });
});
```

### Stick to Black-Box Testing: Test Only Public Methods

Focus on testing the public interface and observable behavior of your code, rather than its internal implementation details. This approach, often called "black-box testing" or "behavioral testing," offers several significant advantages:

- **Reduced Maintenance Overhead:** Tests that delve into internal implementation (`white-box testing`) are fragile. Minor refactors to private methods, even if they don't change the public behavior, can cause these tests to break, leading to unnecessary maintenance burden.
- **Implicit Testing of Internals:** When you thoroughly test the public behavior of a component, its private implementation is implicitly tested. If the public behavior is correct, it means the internal workings are also correct.
- **Focus on Requirements:** Black-box testing encourages you to think about your code from the perspective of its users and the requirements it fulfills, rather than getting bogged down in implementation specifics.

Important: never write tests that read source code files and make string-based assertions about their contents. This creates brittle, meaningless tests that are tightly coupled to the implementation details rather than the behavior of the code.

By adhering to this principle, your tests will break only when there's a genuine problem with the component's external behavior, making them more robust and valuable.

#### ❌ Anti-Pattern: Testing Implementation Details

**Never** write tests that read source code files and make string-based assertions about their contents. This creates brittle, meaningless tests:

```javascript
// BAD: This is fragile and tests implementation, not behavior
test('should have correct imports', async () => {
  const sourceCode = await fs.readFile('src/module.js', 'utf-8');
  assert.ok(sourceCode.includes('import express'), 'Should import express');
  assert.ok(sourceCode.includes('function init'), 'Should have init function');
});
```

#### ✅ Better Approach: Test Actual Behavior

Instead, test the public API and actual functionality:

```javascript
// GOOD: This tests actual behavior and functionality
test('should handle HTTP requests correctly', async () => {
  const app = createApp();
  const response = await request(app).get('/api/health');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'ok');
});

test('should initialize with default configuration', () => {
  const service = createService();
  assert.ok(service.isInitialized());
  assert.strictEqual(service.getPort(), 3000);
});
```

### Test Structure and Style

Tests should be organized using `describe` to group related tests and `test` (or its alias `it`) for individual test cases.

#### Basic Structure

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// The module to be tested
import myModule from '../src/my-module.js';

describe('A group of tests for myModule', () => {
  test('an individual test case', async () => {
    // Test logic goes here
    assert.strictEqual(1, 1);
  });
});
```

#### Asynchronous Tests

Always use `async`/`await` for asynchronous tests.

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Async operations', () => {
  test('should resolve a promise', async () => {
    const result = await Promise.resolve(42);
    assert.strictEqual(result, 42);
  });
});
```

### Error Handling

Use `assert.rejects` to test for expected errors in asynchronous functions and `assert.throws` for synchronous functions.

```javascript
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Error handling', () => {
  test('should reject with an error', async () => {
    const asyncOperation = async () => {
      throw new Error('Something went wrong');
    };
    await assert.rejects(asyncOperation, {
      message: 'Something went wrong',
    });
  });

  test('should throw a synchronous error', () => {
    const syncOperation = () => {
      throw new Error('This is a sync error');
    };
    assert.throws(syncOperation, {
      message: 'This is a sync error',
    });
  });

  test('should reject with an error matching a regex', async () => {
    const asyncOperation = async () => {
      throw new Error('Course non-existent-course not found');
    };
    await assert.rejects(
      asyncOperation,
      /Course non-existent-course not found/,
    );
  });
});
```

### Assertions

Use the `node:assert/strict` module for all assertions. This ensures strict equality checks and avoids common pitfalls.

#### Common Assertions

- `assert.strictEqual(actual, expected[, message])`: Tests for strict equality (`===`).
- `assert.deepStrictEqual(actual, expected[, message])`: Tests for deep equality on objects and arrays. Example: `assert.deepStrictEqual([1, 2, 3], [1, 2, 3]);`
- `assert.ok(value[, message])`: Tests if `value` is truthy.
- `assert.rejects(asyncFn[, error][, message])`: Tests if an `async` function throws an error.
- `assert.throws(fn[, error][, message])`: Tests if a synchronous function throws an error.

### Mocking and Stubbing

Use the built-in mocking capabilities of `node:test` to isolate components and control dependencies. The `t.mock.method()` function is a powerful tool for replacing the implementation of a method on any object, including imported modules.

#### Mocking Module Methods

A common use case is to mock dependencies that are imported from other modules. This allows you to control their behavior and prevent external calls (e.g., to APIs or file systems) during tests.

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Assume these are external modules with functions we need to mock.
import * as setupGcloud from '@google-github-actions/setup-cloud-sdk';
import * as exec from '@actions/exec';

// This is the function we want to test.
import { run } from '../src/main.js';

test('should use cached gcloud SDK if already installed', async (t) => {
  // Mock the functions from the imported modules.
  t.mock.method(setupGcloud, 'isInstalled', () => true);
  const installGcloudSDKMock = t.mock.method(setupGcloud, 'installGcloudSDK');
  t.mock.method(exec, 'getExecOutput', async () => ({
    exitCode: 0,
    stdout: '{}',
  }));

  await run();

  // Assert that the mocked function was NOT called.
  assert.strictEqual(installGcloudSDKMock.mock.callCount(), 0);
});
```

#### Centralized Mocking with Helper Functions

For test suites with many shared dependencies, creating a helper function to set up all the default mocks can significantly reduce boilerplate and improve readability.

```javascript
import { mock } from 'node:test';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

// A helper function that sets up all common mocks.
const setupMocks = (t, overrideInputs = {}) => {
  const inputs = { ...overrideInputs };

  return {
    getInput: t.mock.method(core, 'getInput', (name) => inputs[name]),
    getExecOutput: t.mock.method(exec, 'getExecOutput', async () => ({
      exitCode: 0,
      stderr: '',
      stdout: '{}',
    })),
    // ... other common mocks
  };
};

test('should set the project ID flag when a project_id is provided', async (t) => {
  const mocks = setupMocks(t, { project_id: 'my-test-project' });

  await run(); // The function being tested.

  // Check if the mocked `getExecOutput` was called with the correct arguments.
  const firstCall = mocks.getExecOutput.mock.calls[0];
  assert.ok(firstCall.arguments[1].includes('--project'));
  assert.ok(firstCall.arguments[1].includes('my-test-project'));
});
```

#### Mock Isolation and Cleanup

Ensuring test isolation is paramount for reliable and maintainable test suites. When using `t.mock.method()` within a `test` function or a `suite.test` function, `node:test` automatically handles the cleanup and restoration of the original method after the test completes. This means that mocks created within the scope of a single test will not affect subsequent tests, preventing unintended side effects and ensuring each test runs in a clean environment.

While `node:test` provides this automatic cleanup, it's still good practice to be mindful of any global state or external resources that your mocks might interact with and manage them explicitly using `beforeEach` and `afterEach` hooks if necessary (as demonstrated in the "Setup and Teardown" section).

### Setup and Teardown

Use `before`, `after`, `beforeEach`, and `afterEach` for setting up and tearing down test conditions. These "hooks" are essential for managing resources like temporary files or database connections, ensuring that each test runs in a clean, isolated environment.

The `suite` object, available in the `test` function's callback, is a great way to apply hooks to a specific group of tests.

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs/promises';
import * as path from 'path';

test('File system operations', { concurrency: true }, async (suite) => {
  let tempDir;

  // Create a temporary directory before each test in this suite.
  suite.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join('test-fixtures-'));
  });

  // Clean up the temporary directory after each test.
  suite.afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  suite.test('should write a file to the temp directory', async () => {
    const filePath = path.join(tempDir, 'my-file.txt');
    await fs.writeFile(filePath, 'hello world');
    const content = await fs.readFile(filePath, 'utf-8');
    assert.strictEqual(content, 'hello world');
  });
});
```

### Data-Driven (Table-Driven) Tests

For functions that need to be tested with a variety of different inputs, a data-driven or table-driven approach is highly effective. This pattern involves creating an array of test cases, where each case defines the inputs and the expected outcome. You then loop over the array and run a sub-test for each case. This makes your tests concise, readable, and easy to extend.

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeliverables } from '../src/main.js';

test('#parseDeliverables', async (suite) => {
  const cases = [
    { name: 'empty string', input: '', expected: [] },
    { name: 'single value', input: 'app.yaml', expected: ['app.yaml'] },
    { name: 'space-separated values', input: 'app.yaml foo.yaml', expected: ['app.yaml', 'foo.yaml'] },
    { name: 'comma-separated values', input: 'app.yaml, foo.yaml', expected: ['app.yaml', 'foo.yaml'] },
    { name: 'mixed separators and newlines', input: 'app.yaml,
foo.yaml,   bar.yaml', expected: ['app.yaml', 'foo.yaml', 'bar.yaml'] },
  ];

  for (const tc of cases) {
    await suite.test(tc.name, () => {
      const result = parseDeliverables(tc.input);
      assert.deepStrictEqual(result, tc.expected);
    });
  }
});
```

### Test Fixtures

For complex tests, especially for CLI tools or APIs, use a `fixtures` directory to store sample input files or data. This keeps your tests clean and focused on the logic being tested.

## Testing Web Servers and APIs

When testing web servers, start the server on a random port and use `fetch` to make requests to it.

```javascript
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

describe('API tests', () => {
  let server;
  let port;

  before(async () => {
    await new Promise((resolve) => {
      server = createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Hello, world!' }));
      }).listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(() => {
    server.close();
  });

  test('should return a 200 OK with a JSON payload', async () => {
    const response = await fetch(`http://localhost:${port}`);
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.deepStrictEqual(body, { message: 'Hello, world!' });
  });
});
```

## Testing Commands and CLI Tools

To test command-line tools, use `node:child_process` to execute the CLI and assert on its output. For asynchronous operations where you need to capture streamed output or handle more complex interactions, using `exec` with `util.promisify` is a solid approach.

```javascript
import { exec } from 'node:child_process';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import path from 'node:path';

const execPromise = promisify(exec);

describe('CLI tool tests with exec', () => {
  const cliPath = path.resolve('./my-cli.js');

  test('should output the correct version', async () => {
    const { stdout } = await execPromise(`node ${cliPath} --version`);
    assert.strictEqual(stdout.trim(), '1.0.0');
  });

  test('should output an error message for invalid input', async () => {
    try {
      await execPromise(`node ${cliPath} --invalid-command`);
    } catch (error) {
      assert.match(error.stderr, /Unknown command: --invalid-command/);
    }
  });
});
```

Alternatively, for synchronous command execution, `spawnSync` provides a more direct API. This is particularly useful for testing specific exit codes and exact output without needing `try/catch` blocks for error cases.

When asserting on `stdout` or `stderr`, it's a good practice to use `node:util.stripVTControlCharacters` to remove any ANSI escape codes (e.g., for color) from the output. This makes assertions more robust.

```javascript
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { stripVTControlCharacters } from 'node:util';

test('should exit with status 0 for valid input', () => {
  // Assuming 'my-cli' is an executable command.
  // The arguments are passed as an array.
  const { status, stderr } = spawnSync('my-cli', ['--frail', 'input.txt']);

  assert.equal(status, 0);
  assert.equal(stripVTControlCharacters(String(stderr)), 'input.txt: no issues found
');
});

test('should exit with status 1 for linting errors', () => {
  const { status, stderr } = spawnSync('my-cli', ['lint-error-fixture.txt']);

  assert.equal(status, 1);
  assert.equal(
    stripVTControlCharacters(String(stderr)),
    'lint-error-fixture.txt
' +
      '3:1-3:25 warning Some lint warning
' +
      '
' +
      '⚠ 1 warning
'
  );
});
```

## Testing Stateful Services

When building applications, you will often create stateful services—objects or modules that encapsulate both logic and data that changes over time. Testing these services requires verifying two key properties: that state is correctly maintained within an instance, and that state is properly isolated between different instances.

A common pattern is to use a factory function to create service instances, which helps ensure a clean state for each test.

### Verifying State Maintenance and Isolation

The following example demonstrates how to test a simple `counter` service.

- **State Maintenance**: The first test (`should maintain state across multiple operations`) creates a single service instance and calls its methods multiple times, asserting that the internal state (the counter's value) is updated correctly after each call.
- **State Isolation**: The second test (`should not share state between different service instances`) creates two distinct service instances. It performs operations on both and verifies that the state of one instance is not affected by operations on the other. This is a critical test to prevent bugs related to shared or global state.

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

// Assume createCounterService is a factory function that returns a new service object.
// e.g., function createCounterService(options) { let count = 0; return { ... }; }
import { createCounterService } from './counter-service.js';

describe('Counter Service', () => {
  it('should maintain state across multiple operations', () => {
    const service = createCounterService({ delta: 2 });

    service.increment();
    assert.strictEqual(service.counter(), 2);

    service.increment();
    assert.strictEqual(service.counter(), 4);

    service.decrement();
    assert.strictEqual(service.counter(), 2);
  });

  it('should not share state between different service instances', () => {
    const service1 = createCounterService({ delta: 3 });
    const service2 = createCounterService({ delta: 1 });

    service1.increment();
    service2.increment();

    assert.strictEqual(service1.counter(), 3);
    assert.strictEqual(service2.counter(), 1);

    service1.increment();

    assert.strictEqual(service1.counter(), 6);
    assert.strictEqual(service2.counter(), 1);
  });
});
```

## Testing Console Output

For many applications, especially command-line tools or logging libraries, a primary output is text printed to the console. Testing this requires capturing `console.log`, `console.error`, etc., so you can assert on their output.

### Manual Console Capture with `try...finally`

You can manually capture console output by replacing the `console.log` method with a mock. It is critical to use a `try...finally` block to ensure the original `console.log` is restored after the test, even if an assertion fails. This prevents mocks from leaking between tests.

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

// Assume a utility that captures and restores the console.
import { captureConsole, uncaptureConsole, consoleOutputAsString } from '../src/console-testkit.js';

describe('Manual Console Capture', () => {
  it('should capture log and error output', () => {
    const consoleCapturer = captureConsole();
    try {
      console.log('hello world');
      console.error('oh noes');
      assert.strictEqual(consoleOutputAsString({ consoleCapturer }), 'hello world
oh noes');
    } finally {
      uncaptureConsole({ consoleCapturer });
    }
  });
});
```

### Automated Capture with Test Hooks (Recommended)

A more robust and elegant solution is to create a helper function that uses the test runner's hooks (`beforeEach`, `afterEach`) to automatically manage the capture and release of the console for an entire test suite. This reduces boilerplate and eliminates the risk of forgetting to restore the console.

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// Assume a testkit that integrates with the test runner's hooks.
import { captureConsoleInTest } from '../src/console-testkit.js';

describe('Automated Console Capture', () => {
  // This helper sets up the hooks for the entire suite.
  const { consoleOutputAsString } = captureConsoleInTest(beforeEach, afterEach);

  it('should capture output for the first test', () => {
    console.log('this is test one');
    assert.strictEqual(consoleOutputAsString(), 'this is test one');
  });

  it('should have a clean capture for the second test', () => {
    // The output from the previous test is gone because afterEach cleaned it up.
    console.log('this is test two');
    assert.strictEqual(consoleOutputAsString(), 'this is test two');
  });
});
```

## Testing Side Effects and State Changes

When testing functions or methods that modify the state of an object or an external system (e.g., adding an item to a list, updating a database record), it's crucial to verify these side effects. This often involves performing an action and then querying the system's state to assert that the expected changes have occurred.

### Verifying State Modification and Array Membership

The following example demonstrates how to test a service that manages participants in a group.

- **Verifying Addition**: The first test adds a new participant and then asserts that the total number of participants has increased and that the new participant is present in the list.
- **Testing Idempotency/Edge Cases**: The second test attempts to add an existing participant, verifying that the system handles duplicates correctly (e.g., by not adding them again).
- **Error Handling for Invalid State**: The third test ensures that an error is thrown when attempting to modify a non-existent group.

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

// Assume createTestService is a factory function that returns a service object
// with methods like addParticipantToGroup and _test_listParticipantsInGroup.
import { createTestService } from './test-service.js';

describe('addParticipantToGroup', () => {
  const testGroupId = 'group-123';
  const testParticipant1 = 'participant-A';
  const testParticipant2 = 'participant-B';

  it('should add a new participant to the group', async () => {
    const service = createTestService();
    const newParticipant = 'new-participant';

    await service.addParticipantToGroup(testGroupId, newParticipant);

    const participants =
      await service._test_listParticipantsInGroup(testGroupId);
    assert.strictEqual(participants.length, 3); // Assuming initial state has 2 participants
    assert.ok(participants.includes(newParticipant));
  });

  it('should not add duplicate participant to the group', async () => {
    const service = createTestService();

    // Add an existing participant
    await service.addParticipantToGroup(testGroupId, testParticipant1);

    const participants =
      await service._test_listParticipantsInGroup(testGroupId);
    assert.strictEqual(participants.length, 2); // Should remain 2 if duplicate is not added
    assert.strictEqual(
      participants.filter((p) => p === testParticipant1).length,
      1,
    );
  });

  it('should throw error if group not found', async () => {
    const service = createTestService();
    const nonExistentGroup = 'non-existent-group';

    await assert.rejects(
      () => service.addParticipantToGroup(nonExistentGroup, testParticipant1),
      /Group .* not found/,
    );
  });
});
```
