import nodemailer from 'nodemailer';
import { Order } from '../models/Order.js';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '../services/emailService.js';

// Production backend public URL for resolving image paths in external messages
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'https://quickfit-backend-m1yl.onrender.com';

// Default public apparel image (always reachable, no auth required)
const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';

/**
 * Resolves any product image path to a publicly accessible HTTPS URL.
 * WhatsApp and Email require absolute public URLs — localhost and blob URLs
 * are automatically mapped to the production backend or replaced with a
 * high-quality placeholder.
 */
const resolvePublicImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return DEFAULT_PRODUCT_IMAGE;
  }

  const src = imagePath.trim();

  // Blob / data URIs are never public
  if (src.startsWith('blob:') || src.startsWith('data:')) return DEFAULT_PRODUCT_IMAGE;

  // Localhost → map to production backend uploads
  if (src.includes('localhost') || src.includes('127.0.0.1')) {
    const match = src.match(/\/uploads\/.+/);
    if (match) return `${BACKEND_ORIGIN}${match[0]}`;
    return DEFAULT_PRODUCT_IMAGE;
  }

  // Already absolute HTTPS (Cloudinary, Unsplash, Render, etc.)
  if (/^https?:\/\//i.test(src)) {
    // Re-map embedded localhost upload paths inside absolute URLs
    if (src.includes('/uploads/')) {
      const relativePart = '/uploads/' + src.split('/uploads/')[1];
      return `${BACKEND_ORIGIN}${relativePart}`;
    }
    return src;
  }

  // Relative /uploads/ path
  if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
    const cleanPath = src.startsWith('/') ? src : `/${src}`;
    return `${BACKEND_ORIGIN}${cleanPath}`;
  }

  // Any other relative root path
  if (src.startsWith('/')) return `${BACKEND_ORIGIN}${src}`;

  return DEFAULT_PRODUCT_IMAGE;
};

// ---------------------------------------------------------------------------
// Email Notification (Admin)
// ---------------------------------------------------------------------------

export const sendEmailNotification = async (order) => {
  return sendAdminOrderNotificationEmail(order);
};

// ---------------------------------------------------------------------------
// Automatic Customer Order Confirmation Email & Admin Alert (Nodemailer)
// ---------------------------------------------------------------------------

export { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail };

/**
 * Sends an automatic order confirmation email to the customer using Nodemailer via SMTP.
 * Calls the reusable emailService.sendOrderConfirmationEmail().
 *
 * @param {Object} order - The created order document from MongoDB
 */
export const sendCustomerOrderConfirmationEmail = async (order) => {
  return sendOrderConfirmationEmail(order);
};

// ---------------------------------------------------------------------------
// WhatsApp Admin Order Alert URL
// ---------------------------------------------------------------------------

/**
 * Generates a WhatsApp URL for the admin to view the full order with per-item
 * product photos, specifications, customer details, and GPS location.
 */
export const getWhatsAppOrderUrl = (order) => {
  const phone = process.env.WHATSAPP_PHONE || '917396629821';

  // Build per-product blocks without photos
  const itemBlocks = (order.items || []).map((item, idx) => {
    const colorLine = item.color ? `\n*Color:* ${item.color}` : '';
    const qty = item.quantity || 1;
    const lineTotal = (item.price || 0) * qty;

    return (
      `─────────────────────\n` +
      `*${idx + 1}. ${item.name}*\n` +
      `*Product:* ${item.name}\n` +
      `*Size:* ${item.size || 'M'}${colorLine}\n` +
      `*Quantity:* ${qty}\n` +
      `*Price:* ₹${item.price} × ${qty} = ₹${lineTotal}`
    );
  }).join('\n\n');

  const deliveryAddress = [
    order.customer?.address || '',
    order.customer?.landmark ? `Near ${order.customer.landmark}` : '',
    order.customer?.area || '',
    order.customer?.pincode ? `- ${order.customer.pincode}` : ''
  ].filter(Boolean).join(', ') || 'To be confirmed';

  const message =
    `📦 *New Order Received — QuickFit Menswear*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +

    `🆔 *Order ID:* ${order.orderId}\n` +
    `💳 *Payment:* ${order.paymentMethod || 'COD'}\n\n` +

    `🛍️ *Products Ordered (${(order.items || []).length} item${(order.items || []).length !== 1 ? 's' : ''})*\n` +
    `${itemBlocks}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Total:* ₹${order.totalAmount}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Customer:* ${order.customer?.name || 'N/A'}\n` +
    `*Phone:* ${order.customer?.phone || 'N/A'}\n` +
    `*Address:* ${deliveryAddress}\n` +
    `📍 *Maps:* ${order.locationLink || 'Not provided'}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ QuickFit Vijayawada Express`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

// ---------------------------------------------------------------------------
// WhatsApp Store Owner Order Alert URL
// ---------------------------------------------------------------------------

/**
 * Generates a WhatsApp URL for a specific Store Owner containing only the
 * items from their store in the order.
 *
 * @param {Object} order   - The full order object from MongoDB
 * @param {string} storeId - The specific store's ObjectId string
 * @param {string} ownerPhone - The store owner's phone number (e.g. '919876543210')
 */
export const getStoreOwnerWhatsAppUrl = (order, storeId, ownerPhone) => {
  if (!ownerPhone) return null;

  // Normalize phone: remove +, spaces, dashes; ensure it starts with country code
  const phone = ownerPhone.replace(/[\s\-+]/g, '').replace(/^0+/, '');

  // Filter items that belong to this store
  const storeItems = (order.items || []).filter(
    item => item.storeId?.toString() === storeId?.toString()
  );

  if (storeItems.length === 0) return null;

  const itemBlocks = storeItems.map((item, idx) => {
    const colorLine = item.color ? `\nColor: ${item.color}` : '';
    const qty = item.quantity || 1;
    const lineTotal = (item.price || 0) * qty;

    return (
      `─────────────────────\n` +
      `*${idx + 1}. ${item.name}*\n` +
      `*Product:* ${item.name}\n` +
      `*Size:* ${item.size || 'M'}${colorLine}\n` +
      `*Quantity:* ${qty}\n` +
      `*Price:* ₹${item.price} × ${qty} = ₹${lineTotal}`
    );
  }).join('\n\n');

  const storeItemsTotal = storeItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
  );

  const storeName = storeItems[0]?.storeName || 'Your Store';

  const deliveryAddress = [
    order.customer?.address || '',
    order.customer?.landmark ? `Near ${order.customer.landmark}` : '',
    order.customer?.area || '',
    order.customer?.pincode ? `- ${order.customer.pincode}` : ''
  ].filter(Boolean).join(', ') || 'To be confirmed';

  const message =
    `🏪 *New Order for ${storeName}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +

    `🆔 *Order ID:* ${order.orderId}\n` +
    `💳 *Payment:* ${order.paymentMethod || 'COD'}\n\n` +

    `🛍️ *Your Store Items (${storeItems.length} item${storeItems.length !== 1 ? 's' : ''})*\n` +
    `${itemBlocks}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Your Store Total:* ₹${storeItemsTotal}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Customer:* ${order.customer?.name || 'N/A'}\n` +
    `*Phone:* ${order.customer?.phone || 'N/A'}\n` +
    `*Address:* ${deliveryAddress}\n` +
    `📍 *Maps:* ${order.locationLink || 'Not provided'}\n\n` +

    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ QuickFit Vijayawada Express`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
