'use strict'

const Vendor = require('./VendorClass.js');

const acmeWidgets = new Vendor('Acme-widgets', 'us-east-1', 'https://sqs.us-east-1.amazonaws.com/851725316914/Acme-widgets', 'arn:aws:sns:us-east-1:851725316914:pickup.fifo');

const flowers = new Vendor('1-800-flowers', 'us-east-1', 'https://sqs.us-east-1.amazonaws.com/851725316914/1-800-flowers', 'arn:aws:sns:us-east-1:851725316914:pickup.fifo');


acmeWidgets.startIntervals();

flowers.startIntervals();

