/**
 * Google's Pubsub
 */
const { PubSub } = require("@google-cloud/pubsub");

module.exports = class PubsubHandler {
    constructor() {
        this.pubsub = new PubSub();
    }

    async getOrCreateTopic(topicName) {
        const [topic] = await this.pubsub
            .topic(topicName)
            .get({ autoCreate: true });

        console.log(`Using topic ${topic.name}.`);

        return topic;
    }

    async getOrCreateSubscription(subscriptionName, topic) {
        const [subscription] = await topic
            .subscription(subscriptionName)
            .get({ autoCreate: true });

        console.log(`Using subscription <${subscriptionName}>`);

        return subscription;
    }

    async listen(topicName, subscriptionName, opts) {
        const topic = await this.getOrCreateTopic(
            topicName
        );

        const subscription = await this.getOrCreateSubscription(
            subscriptionName,
            topic
        );

        console.log(
            `Listened to topic <${topic.name}> with subscription <${subscription.name}>`
        );

        subscription.on('message', (message) => {
            console.log('Received message:', message.data.toString());

            if (opts.options.autoAck !== false) {
                message.ack();
            }

            if (opts.onMessage !== undefined) {
                opts.onMessage(message);
            }
        });

        subscription.on('error', error => {
            console.log('Received error:', error);
        });
    }

    async emitMessage(
        message,
        topicName
    ) {
        const topic = await this.getOrCreateTopic(topicName);

        console.log(
            {
                message,
            },
            `Found topic <${topic.name}>`
        );

        console.log(
            {
                message,
            },
            `Sending payload to Topic <${topic.name}>`
        );

        return topic.publishJSON(message);
    }
}
