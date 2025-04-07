// src/lib/s3.js
const { S3Client } = require("@aws-sdk/client-s3");

// Create client instance
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Named export (ES Modules)
export { s3Client }; // <-- This is the critical fix