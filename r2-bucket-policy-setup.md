# R2 Bucket Public Access Setup

## Step 1: Create Bucket Policy

You need to apply this bucket policy to your R2 bucket `mirro` to make objects publicly readable:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mirro/*"
    }
  ]
}
```

## Step 2: Apply the Policy

1. Go to your Cloudflare dashboard
2. Navigate to R2 Object Storage
3. Select your `mirro` bucket
4. Go to Settings → Bucket Policies
5. Paste the policy above and save

## Step 3: Verify Public Access

After applying the policy, your files should be accessible at:
`https://pub-f50a78c96ae94eb08dea6fb65f69d0e1.r2.dev/post-media/filename.webm`

## Step 4: Fix Existing URLs

Run the fix API to update existing broken URLs in your database.