# How to Monitor SQS, Lambda, and SNS in AWS Console

## 1. Check SQS Queue (Messages Being Sent)

### Steps:

1. Go to **AWS SQS Console**: https://console.aws.amazon.com/sqs/
2. Click on your queue name (e.g., `student-verification-queue`)
3. Click the **"Send and receive messages"** tab
4. Click **"Poll for messages"**
5. You should see messages with the body: `{"studentEmail":"...","name":"...","studentId":...}`

### What to look for:

- **Messages Available**: Shows pending messages
- **Messages in Flight**: Shows messages being processed
- **Messages Received**: Total messages received
- **Messages Sent**: Total messages sent

### Alternative: CloudWatch Metrics

1. In SQS Console → Your Queue → **Monitoring** tab
2. Check:
   - `NumberOfMessagesSent` - Should increase when admin verifies
   - `NumberOfMessagesReceived` - Should increase when Lambda processes
   - `ApproximateNumberOfMessagesVisible` - Should be low (messages processed quickly)

---

## 2. Check Lambda Function (Processing Messages)

### Steps:

1. Go to **AWS Lambda Console**: https://console.aws.amazon.com/sqs/
2. Click on your function: `verification-email-handler`
3. Go to **"Monitor"** tab
4. Check:
   - **Invocations**: Should increase when messages arrive in SQS
   - **Duration**: How long each execution takes
   - **Errors**: Should be 0 (or check logs if > 0)

### View Logs:

1. In Lambda Console → Your Function → **"Monitor"** tab
2. Click **"View CloudWatch logs"**
3. Or go to **CloudWatch Console** → **Log groups** → `/aws/lambda/verification-email-handler`
4. Click on the latest log stream
5. You should see:
   - `Received SQS event: ...`
   - `Processing message: ...`
   - `SNS publish result: ...`

### Test the Function:

1. In Lambda Console → Your Function → **"Test"** tab
2. Use the test event from README.md
3. Click **"Test"**
4. Check the execution result and logs

---

## 3. Check SNS (Emails Being Sent)

### Steps:

1. Go to **AWS SNS Console**: https://console.aws.amazon.com/sns/
2. Click **"Topics"** in left sidebar
3. Click on your topic (the one used in `SNS_TOPIC_ARN`)
4. Go to **"Subscriptions"** tab
5. Check subscription status:
   - **Confirmed**: Email subscription is active
   - **Pending confirmation**: Check your email for confirmation link

### View Metrics:

1. In SNS Console → Your Topic → **"Monitoring"** tab
2. Check:
   - `NumberOfMessagesPublished` - Should increase when Lambda publishes
   - `NumberOfNotificationsDelivered` - Should increase when emails sent
   - `NumberOfNotificationsFailed` - Should be 0

### Check Email Delivery:

1. In SNS Console → Your Topic → **"Subscriptions"** tab
2. Click on an email subscription
3. Check **"Delivery status"** and **"Delivery logs"**
4. If failed, check the error message

---

## 4. End-to-End Verification

### Quick Test Flow:

1. **Verify a student** in your admin dashboard
2. **Check SQS** (within 1-2 seconds):
   - Should see 1 new message
   - Message body should contain student email and name
3. **Check Lambda** (within 1-2 seconds):
   - Invocations should increase by 1
   - Check logs for successful processing
4. **Check SNS** (within 1-2 seconds):
   - Messages published should increase by 1
5. **Check Email** (within 1-5 minutes):
   - Student should receive verification email

### Troubleshooting:

**If SQS has messages but Lambda not processing:**

- Check Lambda has SQS trigger configured
- Check Lambda IAM role has SQS permissions
- Check Lambda logs for errors

**If Lambda processing but SNS not sending:**

- Check Lambda environment variable `SNS_TOPIC_ARN` is set
- Check Lambda IAM role has SNS publish permission
- Check SNS topic has email subscription confirmed

**If SNS publishing but no email:**

- Check email subscription is confirmed
- Check spam/junk folder
- Check SNS delivery logs for errors

---

## 5. CloudWatch Dashboard (All in One Place)

Create a custom dashboard to see everything:

1. Go to **CloudWatch Console** → **Dashboards**
2. Create new dashboard
3. Add widgets for:
   - SQS: `NumberOfMessagesSent`, `NumberOfMessagesReceived`
   - Lambda: `Invocations`, `Errors`, `Duration`
   - SNS: `NumberOfMessagesPublished`, `NumberOfNotificationsDelivered`

This gives you a real-time view of the entire workflow!
