import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
