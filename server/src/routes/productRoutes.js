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

    // Process 4-angle images structure
    if (!data.images) {
      data.images = {
        front: data.image || '',
        back: '',
        left: '',
        right: ''
      };
    } else {
      // Ensure front is set
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

    const data = { ...req.body };

    // Auto-calculate discount
    if (data.price && data.originalPrice && Number(data.originalPrice) > Number(data.price)) {
      const discountPercent = Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100);
      data.discount = `${discountPercent}% OFF`;
    }

    // Normalize sizes
    if (typeof data.sizes === 'string') {
      data.sizes = data.sizes.split(',').map(s => s.trim()).filter(Boolean);
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

    // Assign other properties
    Object.keys(data).forEach(key => {
      if (key !== 'images' && key !== '_id') {
        product[key] = data[key];
      }
    });

    const updatedProduct = await product.save();
    console.log(`✅ [Product Updated]: "${updatedProduct.name}" | ID: ${updatedProduct._id}`);
    res.json(updatedProduct);
  } catch (error) {
    console.error('❌ [Product Update Error]:', error.message);
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
