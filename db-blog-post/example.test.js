const request = require('supertest');
const { initializeWebServer } = require('./app');

let expressApp;
let wrapper;

describe('/api', () => {

    beforeAll(async () => {
        ({ expressApp, wrapper } = await initializeWebServer());
    });

    // Case 1: Delete after (or before) each test
    // afterEach(async () => {
    //     await wrapper.repository().cleanup();
    // });

    // Case 2: Transactions
    // beforeEach(async () => {
    //     await wrapper.start();
    // });
    // afterEach(async () => {
    //     await wrapper.rollback();
    // });

    // Case 3 (4): Delete only at the end (or not at all)
    afterAll(async () => {
        await wrapper.repository().cleanup();
    });

    test.each(Array.from(Array(500).keys()))('When add new order, then be able to retrieve it', async () => {
        // Arrange
        const orderToAdd = {
            userId: 1,
            productId: 2,
            mode: 'approved',
        };

        // Act
        const { body: { id: addedOrderId } } = await request(expressApp).post('/order').send(orderToAdd);

        // Assert
        const { body } = await request(expressApp).get(`/order/${addedOrderId}`);
        expect(body).toEqual(expect.objectContaining(orderToAdd));
    });

});
