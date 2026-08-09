import express from 'express';
import mongoose from 'mongoose';
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
    console.log(`[PRODUCT GET] Fetched ${products.length} products from MongoDB Atlas (filter: ${JSON.stringify(filter)})`);
    res.json(products);
  } catch (error) {
    console.error('[PRODUCT GET ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get single product by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }

    if (!product) {
      // Fallback search by custom id if any
      product = await Product.findOne({ id });
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log(`[PRODUCT GET] Found product "${product.name}" (ID: ${product._id})`);
    res.json(product);
  } catch (error) {
    console.error('[PRODUCT GET ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Create product (Admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const data = { ...req.body };

    // Required field validation
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (data.price === undefined || data.price === null || isNaN(Number(data.price)) || Number(data.price) < 0) {
      return res.status(400).json({ message: 'A valid product price is required.' });
    }

    data.name = data.name.trim();
    data.price = Number(data.price);

    if (data.originalPrice !== undefined && data.originalPrice !== null && !isNaN(Number(data.originalPrice))) {
      data.originalPrice = Number(data.originalPrice);
      if (data.originalPrice > data.price) {
        const discountPercent = Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100);
        data.discount = `${discountPercent}% OFF`;
      }
    }

    data.stockQuantity = data.stockQuantity !== undefined && !isNaN(Number(data.stockQuantity))
      ? Math.max(0, Number(data.stockQuantity))
      : 25;
    data.inStock = data.stockQuantity > 0;

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

    // Process 4-angle images structure
    if (!data.images) {
      data.images = {
        front: data.image || '',
        back: '',
        left: '',
        right: ''
      };
    } else {
      if (!data.images.front && data.image) {
        data.images.front = data.image;
      }
    }

    // Fallback primary image
    data.image = data.images.front || data.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';
    if (!data.images.front) {
      data.images.front = data.image;
    }

    const product = new Product(data);
    const savedProduct = await product.save();
    console.log(`[PRODUCT CREATE] Successfully inserted into MongoDB Atlas -> "${savedProduct.name}" | _id: ${savedProduct._id}`);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('[PRODUCT CREATE ERROR]:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Update product (Admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID format.' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const data = { ...req.body };

    if (data.name) product.name = data.name.trim();
    if (data.category) product.category = data.category;
    if (data.subcategory) product.subcategory = data.subcategory;

    if (data.price !== undefined && !isNaN(Number(data.price))) {
      product.price = Number(data.price);
    }
    if (data.originalPrice !== undefined) {
      product.originalPrice = !isNaN(Number(data.originalPrice)) ? Number(data.originalPrice) : undefined;
      if (product.originalPrice && product.originalPrice > product.price) {
        const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        product.discount = `${discountPercent}% OFF`;
      } else {
        product.discount = '';
      }
    }
    if (data.stockQuantity !== undefined && !isNaN(Number(data.stockQuantity))) {
      product.stockQuantity = Math.max(0, Number(data.stockQuantity));
      product.inStock = product.stockQuantity > 0;
    }
    if (data.boutique) product.boutique = data.boutique;
    if (data.description) product.description = data.description;

    // Normalize sizes
    if (typeof data.sizes === 'string') {
      product.sizes = data.sizes.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(data.sizes)) {
      product.sizes = data.sizes;
    }

    // Sync images
    if (data.images) {
      product.images = {
        front: data.images.front !== undefined ? data.images.front : product.images?.front || '',
        back: data.images.back !== undefined ? data.images.back : product.images?.back || '',
        left: data.images.left !== undefined ? data.images.left : product.images?.left || '',
        right: data.images.right !== undefined ? data.images.right : product.images?.right || ''
      };
      if (product.images.front) {
        product.image = product.images.front;
      }
    } else if (data.image) {
      product.image = data.image;
      if (!product.images) product.images = {};
      product.images.front = data.image;
    }

    const updatedProduct = await product.save();
    console.log(`[PRODUCT UPDATE] Updated in MongoDB Atlas -> "${updatedProduct.name}" | _id: ${updatedProduct._id}`);
    res.json(updatedProduct);
  } catch (error) {
    console.error('[PRODUCT UPDATE ERROR]:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// Delete product (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID format.' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.deleteOne();
    console.log(`[PRODUCT DELETE] Deleted from MongoDB Atlas -> "${product.name}" | _id: ${product._id}`);
    res.json({ message: 'Product deleted successfully', id: product._id });
  } catch (error) {
    console.error('[PRODUCT DELETE ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
