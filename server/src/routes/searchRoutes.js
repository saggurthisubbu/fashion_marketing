import express from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { SearchHistory } from '../models/SearchHistory.js';
import { Store } from '../models/Store.js';

const router = express.Router();

// Fallback trending searches in case DB is newly initialized
const DEFAULT_TRENDING_SEARCHES = [
  'Oversized T-Shirts',
  'Drop Shoulder',
  'Linen Shirts',
  'Polo T-Shirts',
  'Graphic Tees',
  'Black Streetwear',
  'Casual Shirts',
  'Summer Fits',
];

// Helper to sanitize search string
const sanitizeRegex = (str = '') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/search/suggestions?q=...
// Live search suggestions as the user types (matches products, categories, keywords)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/suggestions', async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    if (!rawQuery || rawQuery.length < 1) {
      return res.json({ suggestions: [], categories: [], products: [] });
    }

    const safeRegex = new RegExp(sanitizeRegex(rawQuery), 'i');

    // Find matching products (only active/in-stock or prioritized)
    const matchingProducts = await Product.find({
      $or: [
        { name: { $regex: safeRegex } },
        { subcategory: { $regex: safeRegex } },
        { category: { $regex: safeRegex } },
        { boutique: { $regex: safeRegex } },
        { storeName: { $regex: safeRegex } },
        { description: { $regex: safeRegex } },
      ],
    })
      .select('name price originalPrice discount image images category subcategory boutique storeName rating inStock badge')
      .limit(6)
      .lean();

    // Extract unique subcategory and category suggestions
    const categoriesSet = new Set();
    const suggestionsSet = new Set();

    matchingProducts.forEach((p) => {
      if (p.name) suggestionsSet.add(p.name);
      if (p.subcategory) categoriesSet.add(p.subcategory);
      if (p.category) categoriesSet.add(p.category);
    });

    // Also match general category / subcategory names if query matches
    const allMatchingCategories = await Product.distinct('subcategory', {
      subcategory: { $regex: safeRegex },
    });
    allMatchingCategories.forEach((cat) => categoriesSet.add(cat));

    res.json({
      query: rawQuery,
      suggestions: Array.from(suggestionsSet).slice(0, 5),
      categories: Array.from(categoriesSet).slice(0, 4),
      products: matchingProducts,
    });
  } catch (error) {
    console.error('[SEARCH SUGGESTIONS ERROR]:', error.message);
    res.status(500).json({ message: error.message, suggestions: [], categories: [], products: [] });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/search/history
// Returns:
// - User's last 10 searches (by userId or userEmail)
// - Top trending searches across all platform users
// - Recommended products for the search overlay
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const { userId, email } = req.query;
    let recentSearches = [];

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      recentSearches = await SearchHistory.find({ userId })
        .sort({ lastSearchedAt: -1 })
        .limit(10)
        .select('query lastSearchedAt')
        .lean();
    } else if (email) {
      recentSearches = await SearchHistory.find({ userEmail: email.toLowerCase() })
        .sort({ lastSearchedAt: -1 })
        .limit(10)
        .select('query lastSearchedAt')
        .lean();
    }

    // Top trending searches (aggregated by search volume)
    const dbTrending = await SearchHistory.aggregate([
      { $group: { _id: '$query', totalCount: { $sum: '$count' } } },
      { $sort: { totalCount: -1 } },
      { $limit: 8 },
    ]);

    let trendingSearches = dbTrending.map((t) => t._id).filter(Boolean);
    if (trendingSearches.length < 5) {
      const merged = new Set([...trendingSearches, ...DEFAULT_TRENDING_SEARCHES]);
      trendingSearches = Array.from(merged).slice(0, 8);
    }

    // Recommended products (featured or high-rated in-stock items)
    const recommendedProducts = await Product.find({ inStock: true })
      .sort({ rating: -1, createdAt: -1 })
      .limit(8)
      .select('name price originalPrice discount image images category subcategory storeName rating badge')
      .lean();

    res.json({
      recent: recentSearches.map((s) => s.query),
      trending: trendingSearches,
      recommended: recommendedProducts,
    });
  } catch (error) {
    console.error('[SEARCH HISTORY ERROR]:', error.message);
    res.json({
      recent: [],
      trending: DEFAULT_TRENDING_SEARCHES,
      recommended: [],
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. POST /api/search/history
// Saves or increments a search query for the user
// ─────────────────────────────────────────────────────────────────────────────
router.post('/history', async (req, res) => {
  try {
    const { query, userId, email } = req.body;
    const cleanQuery = (query || '').trim().toLowerCase();

    if (!cleanQuery || cleanQuery.length < 2) {
      return res.status(400).json({ message: 'Valid search query required' });
    }

    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    } else if (email) {
      filter.userEmail = email.toLowerCase();
    }
    filter.query = cleanQuery;

    await SearchHistory.findOneAndUpdate(
      filter,
      {
        $set: {
          query: cleanQuery,
          lastSearchedAt: new Date(),
          ...(userId && mongoose.Types.ObjectId.isValid(userId) ? { userId } : {}),
          ...(email ? { userEmail: email.toLowerCase() } : {}),
        },
        $inc: { count: 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Keep user's search history capped at max 10 entries
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const allUserSearches = await SearchHistory.find({ userId })
        .sort({ lastSearchedAt: -1 })
        .select('_id');
      if (allUserSearches.length > 10) {
        const toDeleteIds = allUserSearches.slice(10).map((s) => s._id);
        await SearchHistory.deleteMany({ _id: { $in: toDeleteIds } });
      }
    } else if (email) {
      const allEmailSearches = await SearchHistory.find({ userEmail: email.toLowerCase() })
        .sort({ lastSearchedAt: -1 })
        .select('_id');
      if (allEmailSearches.length > 10) {
        const toDeleteIds = allEmailSearches.slice(10).map((s) => s._id);
        await SearchHistory.deleteMany({ _id: { $in: toDeleteIds } });
      }
    }

    res.json({ success: true, query: cleanQuery });
  } catch (error) {
    console.error('[SAVE SEARCH HISTORY ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. DELETE /api/search/history/:query
// Delete a specific search term for the user
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/history/:query', async (req, res) => {
  try {
    const rawQuery = decodeURIComponent(req.params.query || '').trim().toLowerCase();
    const { userId, email } = req.query;

    const filter = { query: rawQuery };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    } else if (email) {
      filter.userEmail = email.toLowerCase();
    }

    await SearchHistory.deleteMany(filter);
    res.json({ success: true, message: `Removed '${rawQuery}' from search history` });
  } catch (error) {
    console.error('[DELETE SEARCH HISTORY ITEM ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. DELETE /api/search/history
// Clear entire search history for the user
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/history', async (req, res) => {
  try {
    const { userId, email } = req.query;
    if (!userId && !email) {
      return res.status(400).json({ message: 'User ID or email is required' });
    }

    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }
    if (email) {
      filter.userEmail = email.toLowerCase();
    }

    await SearchHistory.deleteMany(filter);
    res.json({ success: true, message: 'Search history cleared successfully' });
  } catch (error) {
    console.error('[CLEAR SEARCH HISTORY ERROR]:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /api/search/results
// Full-Featured Search API with Multi-Faceted Filters & Sorting
// ─────────────────────────────────────────────────────────────────────────────
router.get('/results', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    const {
      q = '',
      category,
      subcategory,
      minPrice,
      maxPrice,
      sizes,
      colors,
      storeId,
      storeName,
      inStock,
      isNewArrival,
      isBestSeller,
      sort = 'relevance',
      page = 1,
      limit = 24,
    } = req.query;

    const queryFilter = {};
    const rawSearch = q.trim();

    // 1. Text / Keyword Matching
    if (rawSearch) {
      const safeRegex = new RegExp(sanitizeRegex(rawSearch), 'i');
      queryFilter.$or = [
        { name: { $regex: safeRegex } },
        { subcategory: { $regex: safeRegex } },
        { category: { $regex: safeRegex } },
        { description: { $regex: safeRegex } },
        { boutique: { $regex: safeRegex } },
        { storeName: { $regex: safeRegex } },
        { badge: { $regex: safeRegex } },
      ];
    }

    // 2. Category & Subcategory Filters
    if (category && category !== 'All') {
      queryFilter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }
    if (subcategory && subcategory !== 'All') {
      const subcategoriesArr = subcategory.split(',').map((s) => s.trim()).filter(Boolean);
      if (subcategoriesArr.length === 1) {
        queryFilter.subcategory = { $regex: new RegExp(`^${subcategoriesArr[0]}$`, 'i') };
      } else if (subcategoriesArr.length > 1) {
        queryFilter.subcategory = {
          $in: subcategoriesArr.map((s) => new RegExp(`^${s}$`, 'i')),
        };
      }
    }

    // 3. Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      queryFilter.price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        queryFilter.price.$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        queryFilter.price.$lte = Number(maxPrice);
      }
    }

    // 4. Sizes Filter
    if (sizes) {
      const sizesArr = sizes.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      if (sizesArr.length > 0) {
        queryFilter.sizes = { $in: sizesArr };
      }
    }

    // 5. Colors Filter
    if (colors) {
      const colorsArr = colors.split(',').map((c) => c.trim()).filter(Boolean);
      if (colorsArr.length > 0) {
        queryFilter['colors.name'] = {
          $in: colorsArr.map((c) => new RegExp(`^${c}$`, 'i')),
        };
      }
    }

    // 6. Store Filter
    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      queryFilter.storeId = storeId;
    } else if (storeName && storeName !== 'All') {
      queryFilter.storeName = { $regex: new RegExp(sanitizeRegex(storeName), 'i') };
    }

    // 7. Availability / In Stock Filter
    if (inStock === 'true' || inStock === true) {
      queryFilter.inStock = true;
      queryFilter.stockQuantity = { $gt: 0 };
    }

    // 8. New Arrivals & Best Sellers
    if (isNewArrival === 'true' || isNewArrival === true) {
      // Products added within last 30 days or marked New Arrival
      queryFilter.$or = queryFilter.$or || [];
      queryFilter.badge = { $regex: /new/i };
    }
    if (isBestSeller === 'true' || isBestSeller === true) {
      queryFilter.badge = { $regex: /best|trending/i };
    }

    // 9. Sorting
    let sortOption = { createdAt: -1 };
    switch (sort) {
      case 'price_low':
        sortOption = { price: 1, createdAt: -1 };
        break;
      case 'price_high':
        sortOption = { price: -1, createdAt: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { rating: -1, reviewsCount: -1 };
        break;
      case 'discount':
        sortOption = { discount: -1, price: 1 };
        break;
      case 'relevance':
      default:
        sortOption = { inStock: -1, rating: -1, createdAt: -1 };
        break;
    }

    // 10. Execute Query with Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 24));
    const skipNum = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      Product.find(queryFilter).sort(sortOption).skip(skipNum).limit(limitNum).lean(),
      Product.countDocuments(queryFilter),
    ]);

    // 11. Compute dynamic facet values (available categories, price ranges, sizes, colors, stores) for filter counts
    const facetPipeline = [
      ...(rawSearch
        ? [
            {
              $match: {
                $or: [
                  { name: { $regex: new RegExp(sanitizeRegex(rawSearch), 'i') } },
                  { subcategory: { $regex: new RegExp(sanitizeRegex(rawSearch), 'i') } },
                  { category: { $regex: new RegExp(sanitizeRegex(rawSearch), 'i') } },
                  { description: { $regex: new RegExp(sanitizeRegex(rawSearch), 'i') } },
                ],
              },
            },
          ]
        : []),
      {
        $group: {
          _id: null,
          categories: { $addToSet: '$category' },
          subcategories: { $addToSet: '$subcategory' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          stores: { $addToSet: '$storeName' },
          sizes: { $push: '$sizes' },
        },
      },
    ];

    const facetResults = await Product.aggregate(facetPipeline);
    const facets = facetResults[0] || {
      categories: ['Men'],
      subcategories: ['Oversized T-Shirts', 'Drop Shoulder T-Shirts', 'Polo T-Shirts', 'Shirts'],
      minPrice: 499,
      maxPrice: 2999,
      stores: ['QuickFit Central, Vijayawada', 'QuickFit Express, Benz Circle', 'QuickFit Boutique, Auto Nagar'],
    };

    // Flatten unique sizes
    const uniqueSizes = Array.from(new Set((facets.sizes || []).flat())).filter(Boolean);

    res.json({
      query: rawSearch,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
      products,
      facets: {
        categories: facets.categories?.filter(Boolean) || [],
        subcategories: facets.subcategories?.filter(Boolean) || [],
        minPrice: facets.minPrice || 499,
        maxPrice: facets.maxPrice || 3999,
        stores: facets.stores?.filter(Boolean) || [],
        sizes: uniqueSizes.length ? uniqueSizes : ['S', 'M', 'L', 'XL', 'XXL'],
      },
    });
  } catch (error) {
    console.error('[SEARCH RESULTS API ERROR]:', error.message);
    res.status(500).json({ message: error.message, products: [], total: 0 });
  }
});

export default router;
