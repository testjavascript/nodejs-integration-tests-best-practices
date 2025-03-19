import { buildOrder } from '../order-data-factory';
import { testSetup } from '../setup/test-file-setup';

beforeAll(async () => {
  // ️️️✅ Best Practice: Place the backend under test within the same process
  // ️️️✅ Best Practice: Make it clear what is happening before and during the tests
  await testSetup.start({
    startAPI: true,
    disableNetConnect: true,
    includeTokenInHttpClient: true,
    mockGetUserCalls: true,
    mockMailerCalls: true,
  });
});

beforeEach(() => {
  testSetup.resetBeforeEach();
});

afterAll(async () => {
  // ️️️✅ Best Practice: Clean-up resources after each run
  testSetup.tearDownTestFile();
});

// 🎯 This file is about checking specific route responses
// This is only aspect of component testing, see other files for even more importan sceanrios

// ️️️✅ Best Practice: Structure tests by route name or by any other meaningful category
describe('POST /orders', () => {
  // ️️️✅ Best Practice: Check the response, but not only this! See other files and examples for other effects
  // that should be tested
  test('When adding a new valid order, Then should get back successful approval response', async () => {
    //Arrange
    const orderToAdd = {
      userId: 1,
      productId: 2,
      mode: 'approved',
    };

    //Act
    const receivedAPIResponse = await testSetup
      .getHTTPClient()
      .post('/order', orderToAdd);

    //Assert
    expect(receivedAPIResponse).toMatchObject({
      status: 200,
      data: {
        // ️️️✅ Best Practice: Check the existence + data type of dynamic fields
        id: expect.any(Number),
        mode: 'approved',
      },
    });
  });

  // ️️️✅ Best Practice: Check invalid input
  test('When adding an order without specifying product, stop and return 400', async () => {
    //Arrange
    const orderToAdd = {
      userId: 1,
      mode: 'draft',
    };

    //Act
    const orderAddResult = await testSetup
      .getHTTPClient()
      .post('/order', orderToAdd);

    //Assert
    expect(orderAddResult.status).toBe(400);
  });

  // ️️️✅ Best Practice: Check invalid input
  test('When providing no token, then get unauthorized response', async () => {
    //Arrange
    const orderToAdd = {
      userId: 1,
      mode: 'draft',
    };

    //Act
    const orderAddResult = await testSetup
      .getHTTPClient()
      .post('/order', orderToAdd, { headers: { Authorization: '' } });

    //Assert
    expect(orderAddResult.status).toBe(401);
  });

  test('When ordered by a premium user, Then 10% discount is applied', async () => {
    //Arrange
    // ️️️✅ Best Practice: Use a dynamic factory to craft big payloads and still clarify which specific details
    // are the 'smoking gun' that is responsible for the test outcome
    const orderOfPremiumUser = buildOrder({
      isPremiumUser: true,
      totalPrice: 100,
    });

    //Act
    const addResponse = await testSetup
      .getHTTPClient()
      .post('/order', orderOfPremiumUser);

    //Assert
    const orderAfterSave = await testSetup
      .getHTTPClient()
      .get(`/order/${addResponse.data.id}`);
    expect(orderAfterSave.data.totalPrice).toBe(90);
  });
});
