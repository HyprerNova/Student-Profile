import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const { S3, SNS } = AWS;

const s3 = new S3({ region: process.env.AWS_REGION });
const sns = new SNS({ region: process.env.AWS_REGION });

const PIC_BUCKET = process.env.S3_PIC_BUCKET;
const MARKS_BUCKET = process.env.S3_MARKS_BUCKET;
const LOG_BUCKET = process.env.S3_LOG_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

export const generatePresignedPutUrl = (bucket, key, expires = 300) => {
  return s3.getSignedUrlPromise('putObject', {
    Bucket: bucket,
    Key: key,
    Expires: expires,
    ContentType: bucket.includes('pic') ? 'image/*' : 'application/pdf',
  });
};

export const generatePresignedGetUrl = (bucket, key, expires = 3600) => {
  return s3.getSignedUrlPromise('getObject', {
    Bucket: bucket,
    Key: key,
    Expires: expires,
  });
};

export const logMarksCardChange = async (userId, type) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const partition = `markscard_changes/year=${year}/month=${month}/day=${day}`;
  const key = `${partition}/event_${uuidv4()}.json`;

  const logEntry = {
    user_id: userId,
    type,
    timestamp: new Date().toISOString(),
  };

  await s3.putObject({
    Bucket: LOG_BUCKET,
    Key: key,
    Body: JSON.stringify(logEntry),
    ContentType: 'application/json',
  }).promise();

  await sns.publish({
    TopicArn: SNS_TOPIC_ARN,
    Message: JSON.stringify(logEntry),
    Subject: 'Marks Card Updated',
  }).promise();
};

export { s3, PIC_BUCKET, MARKS_BUCKET, LOG_BUCKET };