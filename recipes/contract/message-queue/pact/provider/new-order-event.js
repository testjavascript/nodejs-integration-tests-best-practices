class OrderCreatedEvent {
    constructor(order, user, product, status) {
        this.order = order;
        this.user = user;
        this.product = product;
        this.status = status;
    }
}

module.exports = (order, user, product, status) => new OrderCreatedEvent(order, user, product, status);
