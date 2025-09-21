# R2 Migration Checklist

## ✅ Completed
- [x] Installed AWS SDK for S3 compatibility
- [x] Created R2 storage utility (`src/lib/r2-storage.ts`)
- [x] Updated posts API to use R2 instead of Vercel Blob
- [x] Created R2 connection test endpoint
- [x] Created migration test script

## 🔧 Required Actions

### 1. Set up Cloudflare R2 (Required)
Follow the guide in `CLOUDFLARE_R2_SETUP.md`:

1. **Create R2 bucket** in Cloudflare Dashboard
2. **Configure public access** for the bucket
3. **Create API token** with read/write permissions
4. **Update environment variables** in `.env`:

```env
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=mirro-media
R2_PUBLIC_URL=https://media.mirro2.com
```

### 2. Test the Setup
Run the migration test script in your browser console:
```javascript
// Copy and paste the contents of migrate-to-r2.js
```

### 3. Deploy to Production
Add the R2 environment variables to your production environment (Vercel/Netlify/etc.)

## 🧪 Testing Commands

### Test R2 Connection
```javascript
fetch('/api/test-r2-connection').then(r => r.json()).then(console.log)
```

### Test R2 Upload
```javascript
fetch('/api/test-r2-connection', {method: 'POST'}).then(r => r.json()).then(console.log)
```

### Test Post Creation
Use the migration script in `migrate-to-r2.js`

## 🚨 Important Notes

1. **Vercel Blob is suspended** - this is why posts weren't saving
2. **R2 is more reliable** and cost-effective than Vercel Blob
3. **All existing posts** with Vercel Blob URLs will still work (they're just suspended from new uploads)
4. **New posts** will use R2 storage once configured

## 🎯 Expected Results

After setup, you should see:
- ✅ Posts saving successfully to database
- ✅ Images/videos uploading to R2
- ✅ Media files accessible via public URLs
- ✅ No more "Vercel Blob suspended" errors

## 🔍 Troubleshooting

If posts still don't save:
1. Check browser console for R2 errors
2. Verify all environment variables are set
3. Test R2 connection endpoint
4. Check Cloudflare R2 dashboard for upload activity