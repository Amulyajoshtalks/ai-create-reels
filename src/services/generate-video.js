import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export default async function handler(req, res) {
  try {
    const command = new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_ARN,
      Payload: JSON.stringify(req.body)
    });

    const { Payload } = await lambda.send(command);
    res.status(200).json(JSON.parse(Buffer.from(Payload).toString()));
  } catch (error) {
    res.status(500).json({ error: 'Processing failed' });
  }
}