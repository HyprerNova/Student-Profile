import AWS from 'aws-sdk';
const sqs = new AWS.SQS({ region: process.env.AWS_REGION });

export const sendToVerificationQueue = async (studentData) => {
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(studentData),
  };
  return sqs.sendMessage(params).promise();
};
