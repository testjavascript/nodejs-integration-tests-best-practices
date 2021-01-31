describe('/API', () => {
  describe('/orders', () => {
    describe('POST', () => {
      describe('When adding a new order', () => {
        describe('And its valid', () => {
          test('Then return approval confirmation and status 200', () => {});
          test('Then send email to store manager', () => {});
          test('Then update customer credit', () => {});
        });
        describe('And the user has no credit', () => {
          test('Then return declined response with status 409', () => {});
          test('Then notify to bank', () => {});
        });
      });
    });
    describe('GET', () => {
      describe('When querying for order', () => {
        describe('And it is approved', () => {
          test('Then return to the caller', () => {});
        });
        describe('And it is declined', () => {
          test('Then return only to admin', () => {});
        });
      });
    });
    describe('DELETE', () => {
      describe('When deleting an order', () => {
        test('Then it returns confirmation with status 200', () => {});
        test('Then it no longer retrievable', () => {});
      });
    });
  });
});
