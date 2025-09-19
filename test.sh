#!/bin/bash

# Replace with your SNS topic ARN
SNS_TOPIC_ARN="arn:aws:sns:ap-south-1:944599182924:amul-tracker-sns"

for i in $(seq 1 25); do
  aws sns publish \
    --topic-arn "$SNS_TOPIC_ARN" \
    --message "Test message number $i" \
    --region ap-south-1
done

echo "✅ Published 25 messages to SNS topic: $SNS_TOPIC_ARN"
