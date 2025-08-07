const crypto = require('crypto');

const webhookSecret = 'your webhook secret'; // Replace with your actual secret

const rawWebhookBody = "json string here"; // Replace with your actual raw JSON string

const generatedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawWebhookBody)
  .digest('hex');

console.log('Generated Signature:', generatedSignature);