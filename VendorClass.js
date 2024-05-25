'use strict';

const AWS = require('aws-sdk');
const Chance = require('chance');

class Vendor {
  constructor(storeName, region, vendorQueueUrl, pickupTopicArn) {
    // Configure AWS
    AWS.config.update({ region });

    this.storeName = storeName;

    this.sns = new AWS.SNS();
    this.sqs = new AWS.SQS();

    this.chance = new Chance();

    this.vendorQueueUrl = vendorQueueUrl;
    this.pickupTopicArn = pickupTopicArn;
  }

  // Function to send a pickup request
  async sendPickupRequest() {
    const storeName = this.storeName;
    const randomName = this.chance.name();
    const randomAddress = this.chance.address();
    const randomOrderId = this.chance.string({ length: 10, alpha: true, numeric: true });

    const order = {
      store: storeName,
      orderId: randomOrderId,
      customer: randomName,
      address: randomAddress,
      vendorUrl: this.vendorQueueUrl
    };

    const params = {
      Message: JSON.stringify(order),
      TopicArn: this.pickupTopicArn,
      MessageGroupId: "orders"
    };

    try {
      await this.sns.publish(params).promise();
    } catch (err) {
      console.error('Error sending pickup request:', err);
    }
  }

  // Function to poll the vendor queue
  async pollVendorQueue() {
    const params = {
      QueueUrl: this.vendorQueueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 1
    };

    try {
      let messages;
      do {
        const data = await this.sqs.receiveMessage(params).promise();
        messages = data.Messages;

        if (messages && messages.length > 0) {
          for (const message of messages) {
            console.log('----------------------');
            console.log(`${this.storeName} SAYS: Thank you for your order ${JSON.parse(message.Body).customer}`);
            await this.sqs.deleteMessage({
              QueueUrl: this.vendorQueueUrl,
              ReceiptHandle: message.ReceiptHandle
            }).promise();
          }
        }
      } while (messages && messages.length > 0);
    } catch (err) {
      console.error('Error polling vendor queue:', err);
    }
  }

  // Method to start the intervals for sending requests and polling
  startIntervals(sendInterval = 3000, pollInterval = 10000) {
    setInterval(() => this.sendPickupRequest(), sendInterval);
    setInterval(() => this.pollVendorQueue(), pollInterval);
  }
}

module.exports = Vendor;
