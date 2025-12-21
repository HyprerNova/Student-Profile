# Verification Email Lambda Function

This Lambda function processes SQS messages when a student is verified and sends email notifications via SNS.

## Setup Instructions

### 1. Create the Lambda Function

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Name: `verification-email-handler`
5. Runtime: `Node.js 20.x` (or latest)
6. Architecture: `x86_64`
7. Click "Create function"

### 2. Upload the Code

**Option A: Using PowerShell (Windows)**

```powershell
cd lambda
npm install
.\deploy.ps1
# Then upload function.zip via Lambda Console or AWS CLI
```

**Option B: Using AWS Lambda Console (Easiest)**

1. Go to Lambda Console → Your function → Code tab
2. Click "Upload from" → ".zip file"
3. Select all files in the `lambda` folder:
   - `verification-email-handler.js` (or `.cjs` version)
   - `package.json`
   - `node_modules/` (after running `npm install`)
4. Create a zip manually or use the console upload

**Option C: Using AWS CLI**

```bash
cd lambda
npm install
# Windows PowerShell:
powershell.exe -Command "Compress-Archive -Path * -DestinationPath function.zip -Force"
# Or use 7-Zip if installed
aws lambda update-function-code \
  --function-name verification-email-handler \
  --zip-file fileb://function.zip
```

**Option D: Manual ZIP creation**

1. Install 7-Zip (https://www.7-zip.org/)
2. Select all files in `lambda` folder (except `.git` and `.md`)
3. Right-click → 7-Zip → Add to archive
4. Name it `function.zip`
5. Upload to Lambda Console

### 3. Configure Environment Variables

In Lambda Console → Configuration → Environment variables:

- `AWS_REGION`: Your AWS region (e.g., `ap-south-1`)
- `SNS_TOPIC_ARN`: Your SNS topic ARN for sending emails

### 4. Set Up SQS Trigger

1. In Lambda Console, go to your function
2. Click "Add trigger"
3. Select "SQS"
4. Choose your SQS queue (the one used in `SQS_QUEUE_URL`)
5. Batch size: `1` (process one message at a time)
6. Click "Add"

### 5. Set IAM Permissions

The Lambda execution role needs:

- `sqs:ReceiveMessage`
- `sqs:DeleteMessage`
- `sqs:GetQueueAttributes`
- `sns:Publish`

Add this policy to your Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:REGION:ACCOUNT_ID:QUEUE_NAME"
    },
    {
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:REGION:ACCOUNT_ID:TOPIC_NAME"
    }
  ]
}
```

### 6. Test the Function

Test event (simulating SQS message):

```json
{
  "Records": [
    {
      "messageId": "test-123",
      "body": "{\"studentEmail\":\"test@example.com\",\"name\":\"Test Student\",\"studentId\":1}",
      "attributes": {},
      "messageAttributes": {}
    }
  ]
}
```

## How It Works

1. Admin clicks "Verify" → Backend updates DB and sends message to SQS
2. SQS triggers Lambda automatically
3. Lambda processes message and publishes to SNS
4. SNS sends email to student

## Troubleshooting

- Check CloudWatch Logs for errors
- Verify SQS queue has messages
- Check SNS topic has email subscriptions
- Verify IAM permissions are correct
