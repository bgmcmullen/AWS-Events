'use strict';

const AWS = require('aws-sdk');
const { Consumer } = require('sqs-consumer');

AWS.config.update({ region: 'us-east-1' }); // Set the correct region

const sqs = new AWS.SQS(); // Create an instance of the AWS SQS service

const app = Consumer.create({
  queueUrl: 'https://sqs.us-east-1.amazonaws.com/851725316914/packages.fifo',
  sqs: sqs, // Provide the SQS instance to the consumer
  handleMessage: handler,
});

function handler(message) {
  console.log(message.Body);
}

app.on('error', (err) => {
  console.error(err.message);
});

app.on('processing_error', (err) => {
  console.error(err.message);
});

app.start();