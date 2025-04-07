// pages/api/update-reel.js

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "eu-north-1" });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { item } = req.body;

  if (!item || !item.id) {
    return res.status(400).json({ message: 'Missing item or ID' });
  }

  try {
    const command = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: item,
    });
    await client.send(command);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('DynamoDB update error:', err);
    res.status(500).json({ error: 'DynamoDB update failed' });
  }
}
