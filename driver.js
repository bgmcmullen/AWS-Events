const AWS = require('aws-sdk');
const util = require('util');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const sqs = new AWS.SQS();

const packagesQueueUrl = 'https://sqs.us-east-1.amazonaws.com/851725316914/packages.fifo'; // Replace with your packages queue URL

// Function to process a package
async function processPackage() {
  const params = {
    QueueUrl: packagesQueueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20
  };

  try {
    // Corrected: Pass the params object directly without JSON.stringify
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
      console.log(order);

      // try {
      //   order = JSON.parse(snsMessage.Message);
      // } catch (err) {
      //   throw new Error(`Failed to parse inner message: ${snsMessage.Message}`);
      // }

      console.log(`Processing order: ${JSON.stringify(order)}`);

      // Validate vendorUrl
      // if (!order.vendorUrl || order.vendorUrl === "queueUrl") {
      //   throw new Error("Invalid vendorUrl in order message");
      // }

      // Simulate delivery time
      await util.promisify(setTimeout)(Math.random() * 5000);

      // Send delivery notification to the vendor's queue
      // const deliveryParams = {
      //   MessageBody: JSON.stringify({ status: 'delivered', orderId: order.orderId }),
      //   QueueUrl: order.vendorUrl
      // };

      // await sqs.sendMessage(deliveryParams).promise();
      // console.log(`Delivery notification sent: ${JSON.stringify(deliveryParams.MessageBody)}`);

      // Delete the processed message from the packages queue
      await sqs.deleteMessage({
        QueueUrl: packagesQueueUrl,
        ReceiptHandle: message.ReceiptHandle
      }).promise();
      console.log(`Deleted message from queue: ${message.ReceiptHandle}`);
    } else {
      console.log('No messages to process');
    }
  } catch (err) {
    console.error('Error processing package:', err);
  }
}

// Continuously process packages
setInterval(processPackage, 10000);
