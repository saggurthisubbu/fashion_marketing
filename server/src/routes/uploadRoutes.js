import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { Media } from '../models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to check Cloudinary configuration
const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key'
  );
};

// Initialize Cloudinary if credentials are provided
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_key_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️ [Upload]: Cloudinary persistent cloud storage initialized.');
} else {
  console.log('📦 [Upload]: Cloudinary credentials not detected. MongoDB Atlas Media Cloud Storage will act as persistent storage.');
}

// Memory storage for fast buffer processing
const storage = multer.memoryStorage();

// File Filter for accepted formats: JPG, JPEG, PNG, WEBP
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|webp)$/i;

  const isExtValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const isMimeValid = allowedMimeTypes.test(file.mimetype);

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only JPG, JPEG, PNG, and WEBP files are supported.'));
  }
};

// 10MB Size Limit for high-resolution product imagery
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

/**
 * Upload buffer to Cloudinary via upload_stream
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'quickfit/products',
        resource_type: 'image',
        quality: 'auto:best', // Disable aggressive compression - upload at maximum fidelity
        ...options
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// ============================================================================
// POST /api/upload - Upload Single Image to Permanent Cloud Storage
// Priority 1: Cloudinary CDN
// Priority 2: MongoDB Atlas Persistent Media Collection (Zero data loss fallback)
// ============================================================================
router.post('/', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image size exceeds 10MB limit. Please compress or select a smaller image.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Image validation failed.'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please select an image file to upload.'
      });
    }

    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const baseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const generatedFilename = `quickfit-${baseName}-${uniqueSuffix}${ext}`;
      const base64Data = req.file.buffer.toString('base64');

      let permanentUrl = '';
      let storageMethod = '';

      // 1. Try Cloudinary if configured
      if (isCloudinaryConfigured()) {
        try {
          console.log(`☁️ [UPLOAD] Uploading ${generatedFilename} to Cloudinary...`);
          const cloudResult = await uploadBufferToCloudinary(req.file.buffer, {
            public_id: `quickfit-${baseName}-${uniqueSuffix}`,
            format: ext.replace('.', '')
          });

          permanentUrl = cloudResult.secure_url;
          storageMethod = 'Cloudinary';
          console.log(`✅ [UPLOAD] Saved permanently in Cloudinary: ${permanentUrl}`);

          // Also save backup record in MongoDB Atlas Media for guaranteed redundancy
          try {
            await Media.create({
              filename: generatedFilename,
              originalName: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              dataBase64: base64Data,
              cloudinaryUrl: permanentUrl,
              uploadedBy: req.user?._id
            });
          } catch (mErr) {
            console.warn('[MEDIA BACKUP NOTICE]:', mErr.message);
          }
        } catch (cloudErr) {
          console.error('⚠️ [UPLOAD] Cloudinary failed, falling back to MongoDB Atlas cloud storage:', cloudErr.message);
        }
      }

      // 2. If Cloudinary is not used or failed, store permanently in MongoDB Atlas Media collection
      if (!permanentUrl) {
        console.log(`💾 [UPLOAD] Storing ${generatedFilename} permanently in MongoDB Atlas Media collection...`);
        const mediaDoc = await Media.create({
          filename: generatedFilename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          dataBase64: base64Data,
          uploadedBy: req.user?._id
        });

        // Return host-agnostic permanent path that works seamlessly across localhost, mobile LAN, and production
        permanentUrl = `/api/upload/media/${mediaDoc._id}`;
        storageMethod = 'MongoDB Atlas Cloud Media';

        console.log(`✅ [UPLOAD] Saved permanently in MongoDB Atlas: /api/upload/media/${mediaDoc._id}`);
      }

      // Also save a copy on local disk if writable (for immediate local cache / dev convenience)
      try {
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(path.join(uploadsDir, generatedFilename), req.file.buffer);

        const clientPublicUploads = path.join(__dirname, '../../../client/public/uploads');
        if (fs.existsSync(clientPublicUploads)) {
          fs.writeFileSync(path.join(clientPublicUploads, generatedFilename), req.file.buffer);
        }
      } catch (localErr) {
        // Disk write failure is acceptable in read-only / serverless containers because cloud storage succeeded
      }

      return res.status(200).json({
        success: true,
        message: `Image permanently saved in ${storageMethod}!`,
        filename: generatedFilename,
        imageUrl: permanentUrl,
        url: permanentUrl,
        path: permanentUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        storage: storageMethod
      });

    } catch (uploadErr) {
      console.error('❌ [UPLOAD FATAL ERROR]:', uploadErr.message);
      return res.status(500).json({
        success: false,
        message: `Failed to permanently save image: ${uploadErr.message}`
      });
    }
  });
});

// ============================================================================
// GET /api/upload/media/:id - Stream Permanent Image directly from MongoDB Atlas
// Survives server restarts, redeployments, rebuilds, and Vercel/Render restarts
// ============================================================================
router.get('/media/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let media = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      media = await Media.findById(id);
    }

    if (!media) {
      media = await Media.findOne({ filename: id });
    }

    if (!media || !media.dataBase64) {
      return res.status(404).json({ message: 'Media not found in cloud database' });
    }

    // If Cloudinary URL is available, redirect directly to Cloudinary CDN with high-res delivery
    if (media.cloudinaryUrl && media.cloudinaryUrl.startsWith('http')) {
      let cloudUrl = media.cloudinaryUrl;
      if (cloudUrl.includes('/upload/') && !cloudUrl.includes('q_auto:best')) {
        cloudUrl = cloudUrl.replace(/\/upload\/(v\d+\/)?/, '/upload/f_auto,q_auto:best,dpr_auto/$1');
      }
      return res.redirect(301, cloudUrl);
    }

    const imageBuffer = Buffer.from(media.dataBase64, 'base64');

    res.set({
      'Content-Type': media.mimetype || 'image/jpeg',
      'Content-Length': imageBuffer.length,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff'
    });

    return res.status(200).send(imageBuffer);
  } catch (error) {
    console.error('❌ [GET MEDIA ERROR]:', error.message);
    res.status(500).json({ message: 'Error retrieving cloud media' });
  }
});

export default router;
