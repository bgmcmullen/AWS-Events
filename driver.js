const AWS = require('aws-sdk');
const util = require('util');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const sqs = new AWS.SQS();

const packagesQueueUrl = 'https://sqs.us-east-1.amazonaws.com/851725316914/packages.fifo'; // Replace with your packages queue URL

// Function to get the number of packages in the queue
async function getQueueSize() {
  const params = {
    QueueUrl: packagesQueueUrl,
    AttributeNames: ['ApproximateNumberOfMessages']
  };

  try {
    const data = await sqs.getQueueAttributes(params).promise();
    return data.Attributes.ApproximateNumberOfMessages;
  } catch (err) {
    console.error('Error getting queue size:', err);
    return null;
  }
}

// Function to process a package
async function processPackage() {
  const params = {
    QueueUrl: packagesQueueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20
  };

  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages && data.Messages.length > 0) {
      const message = data.Messages[0];

      let snsMessage;
      try {
        snsMessage = JSON.parse(message.Body);
      } catch (err) {
        throw new Error(`Failed to parse message body: ${message.Body}`);
      }

      let order = snsMessage.Message;
      try {
        order = JSON.parse(snsMessage.Message);
      } catch (err) {
        throw new Error(`Failed to parse inner message: ${snsMessage.Message}`);
      }

      console.log('----------------------');
      const queueSize = await getQueueSize();
      if (queueSize !== null) {
        console.log(`Packages in queue: ${queueSize}`);
      }
      console.log(`DRIVER SAYS: I picked up order ${order.orderId} from ${order.store}`);

      // Validate vendorUrl
      if (!order.vendorUrl || order.vendorUrl === "queueUrl") {
        throw new Error("Invalid vendorUrl in order message");
      }

      // Simulate delivery time
      await util.promisify(setTimeout)(Math.random() * 5000);

      // Send delivery notification to the vendor's queue
      const deliveryParams = {
        MessageBody: JSON.stringify(order),
        QueueUrl: order.vendorUrl
      };

      await sqs.sendMessage(deliveryParams).promise();
      console.log(`DRIVER SAYS: I delivered order ${order.orderId} to ${order.customer}`);

      // Delete the processed message from the packages queue
      await sqs.deleteMessage({
        QueueUrl: packagesQueueUrl,
        ReceiptHandle: message.ReceiptHandle
      }).promise();

    // Get and print the number of packages in the queue

    }

  } catch (err) {
    console.error('Error processing package:', err);
  }
}

// Continuously process packages
setInterval(processPackage, 5000);
