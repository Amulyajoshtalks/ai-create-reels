import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

async function storeMetadata(metadata) {
  await client.send(new PutCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Item: metadata
  }));
}

async function getVideos() {
  const response = await client.send(new ScanCommand({
    TableName: process.env.DYNAMODB_TABLE,
    Limit: 10
  }));
  return response.Items;
}

export default { storeMetadata, getVideos };