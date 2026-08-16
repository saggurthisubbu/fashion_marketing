// QuickFit Official WhatsApp & Business Notification Service

export const WHATSAPP_BUSINESS_PHONE = "917396629821";
export const BUSINESS_SUPPORT_EMAIL = "support@quickfitmenswear.com";

// Production backend origin for resolving image URLs in WhatsApp messages
const BACKEND_ORIGIN = 'https://quickfit-backend-m1yl.onrender.com';

// Default product placeholder — always publicly accessible (no auth required)
const DEFAULT_PRODUCT_IMAGE_URL =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';

/**
 * Converts any product image path into a fully public HTTPS URL suitable for
 * embedding directly in WhatsApp messages.
 *
 * WhatsApp renders image link previews when the URL is:
 *  - Absolute HTTPS
 *  - Publicly accessible (no localhost, no auth)
 *  - A direct image file or public CDN URL
 *
 * NOTE: WhatsApp's wa.me text API does NOT auto-embed inline images.
 * Including the URL as text allows the recipient to tap it and see the product
 * photo instantly. For multi-image orders, each product URL is listed individually.
 * If an image is missing, a professional QuickFit placeholder is used automatically.
 */
export const getPublicProductImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_PRODUCT_IMAGE_URL;
  }

  const src = imagePath.trim();

  // Blob URLs are local-only — replace with placeholder
  if (src.startsWith('blob:')) return DEFAULT_PRODUCT_IMAGE_URL;

  // Base64 data URIs cannot be shared externally
  if (src.startsWith('data:')) return DEFAULT_PRODUCT_IMAGE_URL;

  // Localhost URLs are not publicly accessible — re-map to production
  if (src.includes('localhost') || src.includes('127.0.0.1')) {
    const uploadsMatch = src.match(/\/uploads\/.+/);
    if (uploadsMatch) return `${BACKEND_ORIGIN}${uploadsMatch[0]}`;
    return DEFAULT_PRODUCT_IMAGE_URL;
  }

  // Already a public HTTPS URL (Cloudinary, Unsplash, Render, etc.) — use as-is
  if (/^https?:\/\//i.test(src)) {
    // Re-map old localhost references embedded inside absolute URLs
    if (src.includes('/uploads/')) {
      const relativePart = '/uploads/' + src.split('/uploads/')[1];
      return `${BACKEND_ORIGIN}${relativePart}`;
    }
    return src;
  }

  // Relative /uploads/ path — prepend production backend
  if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
    const cleanPath = src.startsWith('/') ? src : `/${src}`;
    return `${BACKEND_ORIGIN}${cleanPath}`;
  }

  // Any other relative path — try prepending backend
  if (src.startsWith('/')) return `${BACKEND_ORIGIN}${src}`;

  // Fallback
  return DEFAULT_PRODUCT_IMAGE_URL;
};

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/** Builds a compact delivery address string from a customer object. */
const buildDeliveryAddress = (customer) =>
  [
    customer?.address || customer?.fullAddress || '',
    customer?.landmark ? `Near ${customer.landmark}` : '',
    customer?.area || '',
    customer?.pincode ? `- ${customer.pincode}` : ''
  ]
    .filter(Boolean)
    .join(', ') || 'To be confirmed on chat';

// ---------------------------------------------------------------------------
// Single Product Quick-Order (from Product Detail Modal)
// ---------------------------------------------------------------------------

/**
 * Formats a single-product WhatsApp direct order message with the professional
 * order summary format. Product image URL is placed prominently at the top so
 * both customer and admin can immediately identify the exact product ordered.
 */
export const formatQuickFitWhatsAppOrder = ({
  customerName = 'Valued Customer',
  customerPhone = '',
  productName = "Men's Apparel",
  size = 'M',
  color = '',
  quantity = 1,
  price = 0,
  imageUrl = '',
  address = '',
  locationLink = 'Not provided'
}) => {
  const publicImg = getPublicProductImageUrl(imageUrl);
  const colorLine = color ? `\n*Color:* ${color}` : '';
  const totalPrice = price * quantity;

  const message =
    `📦 *New Order Received — QuickFit Menswear*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +

    `🖼️ *Product Image:*\n` +
    `${publicImg}\n\n` +

    `*Product:* ${productName}\n` +
    `*Size:* ${size}${colorLine}\n` +
    `*Quantity:* ${quantity}\n` +
    `*Price:* ₹${price} × ${quantity} = ₹${totalPrice}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Total:* ₹${totalPrice}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Customer:* ${customerName}\n` +
    `*Phone:* ${customerPhone || 'To be provided'}\n` +
    `*Address:* ${address || 'To be confirmed on chat'}\n` +
    `📍 *Location:* ${locationLink}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ QuickFit — Vijayawada Express Delivery\n` +
    `Please confirm availability and dispatch. 🙏`;

  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message)}`;
};

// ---------------------------------------------------------------------------
// Backward-compatible single product helper (used in ProductCard)
// ---------------------------------------------------------------------------

export const formatSingleProductWhatsApp = (product, selectedSize = 'M') => {
  const imageUrl =
    product?.images?.front || product?.image || '';
  return formatQuickFitWhatsAppOrder({
    customerName: 'Valued Customer',
    productName: product?.name || "Men's Apparel",
    size: selectedSize,
    quantity: 1,
    price: product?.price || 0,
    imageUrl,
    address: '',
    locationLink: 'Not provided'
  });
};

// ---------------------------------------------------------------------------
// Multi-item Full Order — Customer Confirmation (Checkout & Order Confirmation)
// ---------------------------------------------------------------------------

/**
 * Formats a full multi-item order WhatsApp confirmation message.
 *
 * Each product block includes:
 *   🖼️ Product Image: [URL — tap to see photo]
 *   Product: [Name]
 *   Size: [Size]
 *   Color: [Color]   ← omitted when not selected
 *   Quantity: [Qty]
 *   Price: ₹[Price] × [Qty] = ₹[LineTotal]
 *
 * IMAGE STRATEGY:
 *  - Each product's public image URL is included as a tappable link.
 *  - When the recipient taps it in WhatsApp, the full product photo opens.
 *  - If the image is missing, the QuickFit placeholder is used automatically.
 *  - Multiple products each get their own dedicated image block.
 */
export const formatFullOrderWhatsApp = (orderData) => {
  const {
    orderId,
    customer,
    items,
    subtotal,
    discount,
    deliveryFee,
    grandTotal,
    paymentMethod,
    locationLink
  } = orderData;

  const itemBlocks = (items || [])
    .map((item, idx) => {
      // Resolve product image — always falls back to placeholder if missing
      const imageUrl = getPublicProductImageUrl(
        item.images?.front || item.image || item.imageUrl || ''
      );
      const colorLine =
        item.selectedColor || item.color
          ? `\n*Color:* ${item.selectedColor || item.color}`
          : '';
      const sizePart = item.selectedSize || item.size || 'M';
      const qty = item.quantity || item.qty || 1;
      const lineTotal = (item.price || 0) * qty;

      return (
        `─────────────────────\n` +
        `*${idx + 1}. ${item.name}*\n\n` +
        `🖼️ *Product Image:*\n` +
        `${imageUrl}\n\n` +
        `*Product:* ${item.name}\n` +
        `*Size:* ${sizePart}${colorLine}\n` +
        `*Quantity:* ${qty}\n` +
        `*Price:* ₹${item.price} × ${qty} = ₹${lineTotal}`
      );
    })
    .join('\n\n');

  const deliveryAddress = buildDeliveryAddress(customer);

  const discountLine =
    discount && discount > 0 ? `\n*Discount:* -₹${discount}` : '';
  const deliveryLine =
    deliveryFee !== undefined ? `\n*Delivery:* ₹${deliveryFee}` : '';

  const message =
    `📦 *New Order Received — QuickFit Menswear*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🆔 *Order ID:* ${orderId || 'QF-PENDING'}\n\n` +

    `🛍️ *Items Ordered (${(items || []).length})*\n` +
    `${itemBlocks}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Subtotal:* ₹${subtotal || grandTotal}${discountLine}${deliveryLine}\n` +
    `*💳 Payment:* ${paymentMethod || 'COD'}\n` +
    `*🧾 Total:* ₹${grandTotal}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Customer:* ${customer?.fullName || customer?.name || 'Valued Customer'}\n` +
    `*Phone:* ${customer?.phone || 'Not specified'}\n` +
    `*Address:* ${deliveryAddress}\n` +
    `📍 *Location:* ${locationLink || customer?.locationLink || 'Not provided'}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ QuickFit — Vijayawada Express Delivery\n` +
    `Please confirm availability and dispatch. 🙏`;

  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message)}`;
};

// ---------------------------------------------------------------------------
// Admin-facing WhatsApp Order Alert (for use in AdminOrdersTab)
// ---------------------------------------------------------------------------

/**
 * Generates an admin-facing WhatsApp message with per-product image URLs for
 * instant visual identification of the exact item ordered.
 *
 * Professional format per product:
 *   📦 New Order Received
 *
 *   🖼️ Product Image: [URL — tap to see photo]
 *   Product: [Name]
 *   Size: [Size]
 *   Quantity: [Qty]
 *   Price: ₹[Price]
 *
 *   Total: ₹[Total]
 *
 *   Customer: [Name]
 *   Phone: [Number]
 *   Address: [Address]
 */
export const formatAdminWhatsAppOrder = (order) => {
  const {
    orderId,
    customer,
    items,
    totalAmount,
    paymentMethod,
    paymentStatus,
    deliveryStatus,
    locationLink,
    assignedPartner
  } = order;

  const itemBlocks = (items || [])
    .map((item, idx) => {
      // Resolve product image — falls back to placeholder if missing
      const imageUrl = getPublicProductImageUrl(
        item.images?.front || item.image || item.imageUrl || ''
      );
      const colorLine = item.color || item.selectedColor
        ? `\n*Color:* ${item.color || item.selectedColor}`
        : '';
      const sizePart = item.size || item.selectedSize || 'M';
      const qty = item.quantity || item.qty || 1;
      const lineTotal = (item.price || 0) * qty;

      return (
        `─────────────────────\n` +
        `*${idx + 1}. ${item.name}*\n\n` +
        `🖼️ *Product Image:*\n` +
        `${imageUrl}\n\n` +
        `*Product:* ${item.name}\n` +
        `*Size:* ${sizePart}${colorLine}\n` +
        `*Quantity:* ${qty}\n` +
        `*Price:* ₹${item.price} × ${qty} = ₹${lineTotal}`
      );
    })
    .join('\n\n');

  const deliveryAddress = buildDeliveryAddress(customer);

  const riderLine = assignedPartner?.name
    ? `\n🏍️ *Rider:* ${assignedPartner.name} (${assignedPartner.phone || 'N/A'})`
    : '';

  const message =
    `📦 *New Order Received — QuickFit Menswear*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +

    `🆔 *Order ID:* ${orderId}\n` +
    `📋 *Status:* ${deliveryStatus || 'Confirmed'}\n` +
    `💳 *Payment:* ${paymentMethod || 'COD'} (${paymentStatus || 'Pending'})\n\n` +

    `🛍️ *Products Ordered (${(items || []).length} item${(items || []).length !== 1 ? 's' : ''})*\n` +
    `${itemBlocks}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Total:* ₹${totalAmount}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Customer:* ${customer?.name || 'N/A'}\n` +
    `*Phone:* ${customer?.phone || 'N/A'}\n` +
    `*Address:* ${deliveryAddress}\n` +
    `📍 *Maps:* ${locationLink || 'Not provided'}` +
    `${riderLine}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ QuickFit Vijayawada Ops Dashboard`;

  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message)}`;
};
