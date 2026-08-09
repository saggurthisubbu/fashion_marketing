import express from 'express';
import { Product } from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all products (Public)
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, search } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (subcategory && subcategory !== 'All') {
      filter.subcategory = subcategory;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product (Admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body };

    // Auto-calculate discount if originalPrice > price
    if (data.price && data.originalPrice && Number(data.originalPrice) > Number(data.price)) {
      const discountPercent = Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100);
      data.discount = `${discountPercent}% OFF`;
    }

    // Default category to Men
    if (!data.category) data.category = 'Men';
    if (!data.subcategory) data.subcategory = 'Oversized T-Shirts';

    // Normalize sizes if string
    if (typeof data.sizes === 'string') {
      data.sizes = data.sizes.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!data.sizes || data.sizes.length === 0) {
      data.sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    }

    // Fallback image if empty
    if (!data.image) {
      data.image = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';
    }

    const product = new Product(data);
    const savedProduct = await product.save();
    console.log(`✅ [Product Created]: "${savedProduct.name}" | ID: ${savedProduct._id}`);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('❌ [Product Creation Error]:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Update product (Admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
