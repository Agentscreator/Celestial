# Cloudflare R2 Setup Guide

## Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Name your bucket: `mirro-media` (or any name you prefer)
5. Choose a location close to your users
6. Click **Create bucket**

## Step 2: Configure Public Access

1. In your bucket settings, go to **Settings** tab
2. Under **Public access**, click **Allow Access**
3. Add a custom domain (recommended) or use the R2.dev subdomain
4. For custom domain: `media.mirro2.com` (or your preferred subdomain)

## Step 3: Create API Token

1. Go to **Manage R2 API tokens**
2. Click **Create API token**
3. Give it a name: `mirro-media-upload`
4. Set permissions:
   - **Object:Edit** for your bucket
   - **Object:Read** for your bucket
5. Copy the **Access Key ID** and **Secret Access Key**

## Step 4: Update Environment Variables

Replace the values in your `.env` file:

```env
# Cloudflare R2 Storage
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=mirro-media
R2_PUBLIC_URL=https://media.mirro2.com
```

**To find your Account ID:**
1. Go to Cloudflare Dashboard
2. Look at the right sidebar - your Account ID is listed there
3. Replace `YOUR_ACCOUNT_ID` with this value

**For R2_PUBLIC_URL:**
- If using custom domain: `https://your-custom-domain.com`
- If using R2.dev: `https://pub-[hash].r2.dev` (found in bucket settings)

## Step 5: Test the Setup

1. Start your development server
2. Try creating a post with an image
3. Check the browser console for R2 upload logs
4. Verify the image appears correctly in your app

## Step 6: Production Deployment

Make sure to add these environment variables to your production environment (Vercel, Netlify, etc.):

- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your bucket allows public read access
2. **403 Forbidden**: Check your API token permissions
3. **Invalid Endpoint**: Verify your Account ID in the endpoint URL
4. **Files not accessible**: Ensure public access is enabled on the bucket

### Testing Connection:

Use this script in your browser console to test R2 connectivity:

```javascript
fetch('/api/test-r2-connection')
  .then(r => r.json())
  .then(console.log)
```

## Benefits of R2 over Vercel Blob:

- **No storage limits** (pay per usage)
- **Better performance** with global CDN
- **More reliable** - no account suspensions
- **Cost effective** - $0.015/GB/month
- **S3 compatible** - easy to migrate if needed