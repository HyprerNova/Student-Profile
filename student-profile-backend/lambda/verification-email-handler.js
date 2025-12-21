// Lambda function to process SQS messages and send verification emails via SNS
// This function is triggered by SQS events

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'ap-south-1',
});
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

export const handler = async (event) => {
  console.log('Received SQS event:', JSON.stringify(event, null, 2));

  const results = [];

  // Process each SQS record
  for (const record of event.Records) {
    try {
      // Parse the SQS message body
      const messageBody = JSON.parse(record.body);
      console.log('Processing message:', messageBody);

      // Extract student data
      const { studentEmail, name, studentId } = messageBody;

      if (!studentEmail || !name) {
        console.error('Missing required fields in message:', messageBody);
        results.push({ success: false, error: 'Missing required fields' });
        continue;
      }

      // Create email message
      const emailSubject = 'Account Verification Successful';
      const emailMessage = `
Hello ${name},

Your student account has been successfully verified!

You can now access all features of the Student Profile Management system.

Thank you,
Student Profile Management Team
      `.trim();

      // Publish to SNS (which will send the email)
      const publishCommand = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: emailSubject,
        Message: emailMessage,
        MessageAttributes: {
          email: {
            DataType: 'String',
            StringValue: studentEmail,
          },
        },
      });

      const result = await snsClient.send(publishCommand);
      console.log('SNS publish result:', result);

      results.push({
        success: true,
        messageId: result.MessageId,
        studentEmail,
      });
    } catch (error) {
      console.error('Error processing record:', error);
      results.push({
        success: false,
        error: error.message,
        recordId: record.messageId,
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      processed: results.length,
      results,
    }),
  };
};
