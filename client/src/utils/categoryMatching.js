/**
 * Category Classification & Similar Products Matching for QuickFit
 * 
 * Ensures strict categorization:
 * - Shirts only match shirts (excluding any t-shirts/tees/polos/oversized)
 * - Polo T-Shirts only match polo t-shirts
 * - Oversized T-Shirts only match oversized t-shirts
 * - Drop Shoulder T-Shirts only match drop shoulder t-shirts
 * - Never shows random products from other categories
 */

export const getCategoryGroup = (product) => {
  if (!product) return 'unknown';

  const sub = (product.subcategory || '').toLowerCase().trim();
  const cat = (product.category || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();

  // 1. Oversized T-Shirts (matches "oversized", "over sized", "oversize")
  if (
    sub.includes('oversized') ||
    sub.includes('over sized') ||
    sub.includes('oversize') ||
    name.includes('oversized') ||
    name.includes('over sized') ||
    name.includes('oversize') ||
    cat.includes('oversized') ||
    cat.includes('over sized')
  ) {
    return 'oversized-t-shirts';
  }

  // 2. Polo T-Shirts (matches "polo", "polos")
  if (
    sub.includes('polo') ||
    name.includes('polo') ||
    cat.includes('polo')
  ) {
    return 'polo-t-shirts';
  }

  // 3. Drop Shoulder T-Shirts
  if (
    sub.includes('drop shoulder') ||
    sub.includes('drop-shoulder') ||
    sub.includes('dropshoulder') ||
    name.includes('drop shoulder') ||
    name.includes('drop-shoulder') ||
    name.includes('dropshoulder')
  ) {
    return 'drop-shoulder-t-shirts';
  }

  // 4. Pants / Jeans / Trousers
  if (
    sub.includes('pant') ||
    sub.includes('jean') ||
    sub.includes('trouser') ||
    sub.includes('denim') ||
    cat.includes('pant') ||
    cat.includes('jean') ||
    name.includes('pant') ||
    name.includes('jeans')
  ) {
    return 'pants';
  }

  // 5. Shirts
  // STRICT RULE: If the product is a shirt, it must NOT be a t-shirt / tee / polo / drop shoulder / oversized.
  const isTShirt = (
    sub.includes('t-shirt') ||
    sub.includes('tshirt') ||
    cat.includes('t-shirt') ||
    cat.includes('tshirt') ||
    name.includes('t-shirt') ||
    name.includes('tshirt') ||
    name.includes(' tee') ||
    name.endsWith('tee') ||
    name.startsWith('tee ')
  );

  if (!isTShirt && (sub.includes('shirt') || cat.includes('shirt') || name.includes('shirt'))) {
    return 'shirts';
  }

  // 6. Generic Fallback: Clean normalized subcategory or category
  const fallback = sub || cat || 'other';
  return fallback.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

/**
 * Returns human-readable label for the category group
 */
export const getCategoryGroupLabel = (groupKey) => {
  switch (groupKey) {
    case 'oversized-t-shirts':
      return 'Oversized T-Shirts';
    case 'polo-t-shirts':
      return 'Polo T-Shirts';
    case 'drop-shoulder-t-shirts':
      return 'Drop Shoulder T-Shirts';
    case 'shirts':
      return 'Shirts';
    case 'pants':
      return 'Pants & Denim';
    default:
      return groupKey
        ? groupKey.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
        : 'Collection';
  }
};

/**
 * Filter similar products strictly from the same category group
 * Excludes currently viewed product
 * Limits to between 4 and 8 items (or all available in category if fewer)
 */
export const getSimilarProducts = (currentProduct, allProducts, maxItems = 8) => {
  if (!currentProduct || !Array.isArray(allProducts) || allProducts.length === 0) {
    return [];
  }

  const currentId = String(currentProduct._id || currentProduct.id || '');
  const currentGroup = getCategoryGroup(currentProduct);

  const matched = allProducts.filter((item) => {
    const itemId = String(item._id || item.id || '');
    // Exclude currently viewed product
    if (itemId === currentId) return false;
    // Exclude disabled or unpublished products
    if (item.isActive === false || item.published === false) return false;

    const itemGroup = getCategoryGroup(item);
    // Strict match: ONLY products in the same category group
    return itemGroup === currentGroup;
  });

  return matched.slice(0, maxItems);
};
