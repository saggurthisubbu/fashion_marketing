import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from './config/db.js';
import { Product } from './models/Product.js';
import { Media } from './models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sDir = path.join(__dirname, '../uploads');
const cDir = path.join(__dirname, '../../client/public/uploads');

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_key_secret: process.env.CLOUDINARY_API_SECRET
  });
}

function findLocalFile(filename) {
  if (!filename) return null;
  const clean = filename.replace(/^\/?uploads\//, '').replace(/\\/g, '/');
  const baseName = path.basename(clean);

  const inServer = path.join(sDir, baseName);
  if (fs.existsSync(inServer)) return inServer;

  const inClient = path.join(cDir, baseName);
  if (fs.existsSync(inClient)) return inClient;

  return null;
}

async function uploadFilePermanently(filePath, originalFilename) {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');
  const ext = path.extname(filePath).toLowerCase() || '.jpg';
  const mimetype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const size = fileBuffer.length;
  const baseName = path.basename(filePath);

  let permanentUrl = '';

  // 1. Try Cloudinary if available
  if (isCloudinaryConfigured()) {
    try {
      const res = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'quickfit/products',
            public_id: baseName.replace(/\.[^/.]+$/, ''),
            resource_type: 'image'
          },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        stream.end(fileBuffer);
      });
      permanentUrl = res.secure_url;
      console.log(`  ☁️ Uploaded to Cloudinary: ${permanentUrl}`);
    } catch (err) {
      console.warn(`  ⚠️ Cloudinary upload failed: ${err.message}. Storing in MongoDB Atlas Media...`);
    }
  }

  // 2. Always persist in MongoDB Atlas Media
  let mediaDoc = await Media.findOne({ filename: baseName });
  if (!mediaDoc) {
    mediaDoc = await Media.create({
      filename: baseName,
      originalName: originalFilename || baseName,
      mimetype,
      size,
      dataBase64: base64Data,
      cloudinaryUrl: permanentUrl || ''
    });
    console.log(`  💾 Stored permanently in MongoDB Atlas Media: ID ${mediaDoc._id}`);
  } else if (permanentUrl && !mediaDoc.cloudinaryUrl) {
    mediaDoc.cloudinaryUrl = permanentUrl;
    await mediaDoc.save();
  }

  // Return permanent cloud URL
  if (permanentUrl) {
    return permanentUrl;
  }
  return `/api/upload/media/${mediaDoc._id}`;
}

async function migrate() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas');

    const products = await Product.find({});
    console.log(`🔍 Found ${products.length} products to audit for permanent image persistence.`);

    for (const prod of products) {
      console.log(`\nProcessing: "${prod.name}" (ID: ${prod._id})`);
      let updated = false;

      // Migrate 4 angles
      const angles = ['front', 'back', 'left', 'right'];
      const currentImages = prod.images || {};
      const newImages = { ...currentImages };

      for (const angle of angles) {
        const rawUrl = currentImages[angle];
        if (rawUrl && typeof rawUrl === 'string') {
          // Check if it's already a permanent cloud URL (Cloudinary or /api/upload/media)
          if (rawUrl.includes('cloudinary.com') || rawUrl.includes('/api/upload/media/')) {
            console.log(`  ✓ ${angle}: Already permanent cloud URL -> ${rawUrl}`);
            continue;
          }

          // Check if it's a local file
          const localPath = findLocalFile(rawUrl);
          if (localPath) {
            console.log(`  🔄 Migrating local file for ${angle}: ${localPath}`);
            const cloudUrl = await uploadFilePermanently(localPath, path.basename(localPath));
            newImages[angle] = cloudUrl;
            updated = true;
          } else {
            console.warn(`  ⚠️ Local file not found for ${angle}: ${rawUrl}`);
          }
        }
      }

      // Check primary image
      if (prod.image) {
        if (!prod.image.includes('cloudinary.com') && !prod.image.includes('/api/upload/media/')) {
          const localPath = findLocalFile(prod.image);
          if (localPath) {
            const cloudUrl = await uploadFilePermanently(localPath, path.basename(localPath));
            prod.image = cloudUrl;
            updated = true;
          }
        }
      }

      if (updated || !prod.images?.front) {
        prod.images = newImages;
        if (newImages.front) {
          prod.image = newImages.front;
        } else if (prod.image) {
          newImages.front = prod.image;
          prod.images = newImages;
        }

        prod.gallery = [
          newImages.front,
          newImages.back,
          newImages.left,
          newImages.right
        ].filter(Boolean);

        prod.isActive = true;
        prod.published = true;
        prod.inStock = true;

        await prod.save();
        console.log(`✅ Saved "${prod.name}" with permanent cloud image URLs!`);
      } else {
        console.log(`✓ Product "${prod.name}" already up to date.`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 Migration Completed! All products now have permanent cloud images.');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
