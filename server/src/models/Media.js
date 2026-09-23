import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String },
  mimetype: { type: String, required: true, default: 'image/jpeg' },
  size: { type: Number, required: true },
  // Stored as Base64 string for efficient MongoDB Atlas document storage and quick retrieval
  dataBase64: { type: String, required: true },
  cloudinaryUrl: { type: String, default: '' },
  folder: { type: String, default: 'quickfit/products' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Index for fast lookup by filename or id
mediaSchema.index({ filename: 1 });
mediaSchema.index({ createdAt: -1 });

export const Media = mongoose.model('Media', mediaSchema);
export default Media;
