import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: String },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 25 },
  expressDelivery: { type: String, default: '40 Mins Express' },
  boutique: { type: String, default: 'MG Road Trendz, Vijayawada' },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, required: true, default: 50 },
  featured: { type: Boolean, default: false },
  badge: { type: String, default: 'Bestseller' },
  description: { type: String },
  sizes: [{ type: String }],
  colors: [{
    name: String,
    hex: String
  }],
  image: { type: String, required: true },
  gallery: [{ type: String }]
}, { timestamps: true });

// Auto-update inStock based on stockQuantity
productSchema.pre('save', function (next) {
  if (this.stockQuantity <= 0) {
    this.inStock = false;
    this.stockQuantity = 0;
  } else {
    this.inStock = true;
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
