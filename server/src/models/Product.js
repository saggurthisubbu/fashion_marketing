import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' }, // Now mandatory for new products
  storeName: { type: String }, // Stored for easier frontend queries
  category: { type: String, default: 'Men' },
  subcategory: { type: String, default: 'Oversized T-Shirts' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: String },
  rating: { type: Number, default: 4.9 },
  reviewsCount: { type: Number, default: 24 },
  expressDelivery: { type: String, default: 'Express Delivery' },
  boutique: { type: String, default: 'QuickFit Central, Vijayawada' },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, required: true, default: 25 },
  featured: { type: Boolean, default: true },
  badge: { type: String, default: 'Bestseller' },
  description: { type: String, default: 'Premium heavyweight cotton streetwear crafted for clean modern fit and durability.' },
  sizes: { type: [String], default: ['S', 'M', 'L', 'XL', 'XXL'] },
  colors: [{
    name: { type: String, default: 'Black' },
    hex: { type: String, default: '#000000' }
  }],
  // Multi-angle image views
  images: {
    front: { type: String, default: '' },
    back: { type: String, default: '' },
    left: { type: String, default: '' },
    right: { type: String, default: '' }
  },
  // Primary image fallback
  image: { type: String },
  gallery: [{ type: String }]
}, { timestamps: true });

// Auto-sync image and gallery before save
productSchema.pre('save', function (next) {
  const DEFAULT_IMG = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';

  // Sync primary image
  if (this.images && this.images.front) {
    this.image = this.images.front;
  } else if (this.image && (!this.images || !this.images.front)) {
    if (!this.images) this.images = {};
    this.images.front = this.image;
  } else {
    this.image = DEFAULT_IMG;
    if (!this.images) this.images = {};
    this.images.front = DEFAULT_IMG;
  }

  // Populate gallery array
  if (this.images) {
    this.gallery = [
      this.images.front,
      this.images.back,
      this.images.left,
      this.images.right
    ].filter(Boolean);
  }

  // Stock controller
  if (this.stockQuantity <= 0) {
    this.inStock = false;
    this.stockQuantity = 0;
  } else {
    this.inStock = true;
  }
  next();
});

// Compound text index for full-text search across all relevant fields
productSchema.index({
  name: 'text',
  category: 'text',
  subcategory: 'text',
  description: 'text',
  boutique: 'text',
  storeName: 'text',
  badge: 'text'
}, {
  weights: {
    name: 10,
    subcategory: 8,
    category: 5,
    badge: 4,
    storeName: 3,
    boutique: 2,
    description: 1
  },
  name: 'ProductTextIndex'
});

// Single-field and compound indexes for fast filtering and sorting
productSchema.index({ inStock: 1, price: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ storeId: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
export default Product;
