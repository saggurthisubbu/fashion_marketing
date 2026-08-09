import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    cb(null, `quickfit-${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File Filter for accepted formats: JPG, JPEG, PNG, WEBP
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|webp)$/i;

  const isExtValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const isMimeValid = allowedMimeTypes.test(file.mimetype);

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed.'));
  }
};

// 5MB Size Limit
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// POST /api/upload - Upload Single Image
router.post('/', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 5MB limit. Please upload a smaller image.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file to upload.' });
    }

    // Relative path is portable across localhost, mobile Wi-Fi, and production deployments
    const relativePath = `/uploads/${req.file.filename}`;

    console.log(`[UPLOAD] Image saved successfully: ${req.file.filename} (${(req.file.size / 1024).toFixed(1)} KB) -> ${relativePath}`);

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully!',
      filename: req.file.filename,
      imageUrl: relativePath,
      url: relativePath,
      path: relativePath,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  });
});

export default router;
