import nodemailer from 'nodemailer';
import { Order } from '../models/Order.js';

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
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@quickfitmenswear.com';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || adminEmail,
      pass: process.env.EMAIL_PASS || ''
    }
  });

  // Build a rich HTML email with product thumbnails
  const itemRowsHtml = (order.items || []).map((item) => {
    const imgUrl = resolvePublicImageUrl(item.images?.front || item.image || item.imageUrl || '');
    const qty = item.quantity || 1;
    const lineTotal = (item.price || 0) * qty;
    const color = item.color ? ` | Color: ${item.color}` : '';

    return `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px; vertical-align: top;">
          <img src="${imgUrl}" alt="${item.name}" width="70" height="90"
               style="object-fit: cover; border-radius: 8px; border: 1px solid #3f3f46;"
               onerror="this.src='${DEFAULT_PRODUCT_IMAGE}'" />
        </td>
        <td style="padding: 12px; vertical-align: top; color: #e4e4e7; font-family: system-ui, sans-serif;">
          <div style="font-weight: 900; font-size: 14px; color: #ffffff;">${item.name}</div>
          <div style="font-size: 12px; margin-top: 4px; color: #a1a1aa;">Size: ${item.size || 'M'}${color}</div>
          <div style="font-size: 12px; color: #a1a1aa;">Qty: ${qty}</div>
          <div style="font-size: 13px; font-weight: bold; color: #fff; margin-top: 4px;">₹${lineTotal}</div>
        </td>
      </tr>`;
  }).join('');

  const itemsListText = (order.items || []).map((item) => {
    const color = item.color ? `, Color: ${item.color}` : '';
    const qty = item.quantity || 1;
    const imgUrl = resolvePublicImageUrl(item.images?.front || item.image || item.imageUrl || '');
    return `- ${item.name} (Size: ${item.size || 'M'}${color}) ×${qty} = ₹${(item.price || 0) * qty}\n  Image: ${imgUrl}`;
  }).join('\n');

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#09090b;font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#18181b;border-radius:16px;padding:24px;border:1px solid #27272a;">
    <h1 style="color:#fff;font-size:22px;margin:0 0 4px;">🚨 New Order Received</h1>
    <p style="color:#a1a1aa;font-size:13px;margin:0 0 20px;">QuickFit Menswear — Vijayawada</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#09090b;border-radius:12px;overflow:hidden;border:1px solid #27272a;">
      <tr style="background:#1c1c1e;">
        <th style="padding:10px 12px;text-align:left;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Product</th>
        <th style="padding:10px 12px;text-align:left;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Details</th>
      </tr>
      ${itemRowsHtml}
    </table>

    <div style="background:#09090b;border-radius:12px;padding:16px;border:1px solid #27272a;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#a1a1aa;font-size:13px;">Order ID</span>
        <span style="color:#fff;font-weight:900;font-size:13px;font-family:monospace;">${order.orderId}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:#a1a1aa;font-size:13px;">Payment</span>
        <span style="color:#fff;font-size:13px;">${order.paymentMethod || 'COD'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid #27272a;">
        <span style="color:#fff;font-weight:900;font-size:16px;">Grand Total</span>
        <span style="color:#fff;font-weight:900;font-size:16px;">₹${order.totalAmount}</span>
      </div>
    </div>

    <div style="background:#09090b;border-radius:12px;padding:16px;border:1px solid #27272a;">
      <div style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Customer Details</div>
      <div style="color:#fff;font-weight:700;font-size:15px;margin-bottom:4px;">${order.customer?.name}</div>
      <div style="color:#a1a1aa;font-size:13px;">📞 ${order.customer?.phone}</div>
      <div style="color:#a1a1aa;font-size:13px;">✉️ ${order.customer?.email || 'Not provided'}</div>
      <div style="color:#a1a1aa;font-size:13px;margin-top:4px;">
        📍 ${order.customer?.address}, ${order.customer?.landmark || ''}, ${order.customer?.area} - ${order.customer?.pincode}
      </div>
      ${order.locationLink ? `<div style="margin-top:8px;"><a href="${order.locationLink}" style="color:#60a5fa;font-size:12px;">View on Google Maps →</a></div>` : ''}
    </div>
  </div>
</div>
</body>
</html>`;

  const mailOptions = {
    from: `"QuickFit Orders" <${process.env.EMAIL_USER || adminEmail}>`,
    to: adminEmail,
    subject: `🚨 NEW ORDER #${order.orderId} — ₹${order.totalAmount} — ${order.customer?.name}`,
    text: `
NEW QUICKFIT ORDER RECEIVED!

Order ID: ${order.orderId}
Customer Name: ${order.customer?.name}
Phone: ${order.customer?.phone}
Email: ${order.customer?.email || 'Not provided'}
Delivery Address: ${order.customer?.address}, ${order.customer?.landmark || ''}, ${order.customer?.area}, ${order.customer?.pincode}
Location Link: ${order.locationLink || 'Not provided'}
Payment Method: ${order.paymentMethod}

ORDER ITEMS:
${itemsListText}

Total Amount: ₹${order.totalAmount}
Order Date: ${new Date(order.orderDate).toLocaleString('en-IN')}

QuickFit Menswear Vijayawada
`,
    html: htmlBody
  };

  try {
    if (process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'mock_email_pass') {
      await transporter.sendMail(mailOptions);
      console.log(`[Email Sent]: Order #${order.orderId} sent to ${adminEmail}`);
    } else {
      console.log(`[Email Mocked]: Order #${order.orderId} (Set EMAIL_PASS in .env to send live emails)`);
    }
  } catch (error) {
    console.error(`[Email Error]: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Automatic Customer Order Confirmation Email (Nodemailer)
// ---------------------------------------------------------------------------

/**
 * Sends an automatic order confirmation email to the customer using Nodemailer.
 * - Skipped if customer does not provide an email address.
 * - Saves email delivery status in the order record ('Sent', 'Failed', 'Skipped').
 * - Handles failures gracefully without breaking the order flow.
 *
 * @param {Object} order - The created order document from MongoDB
 */
export const sendCustomerOrderConfirmationEmail = async (order) => {
  const customerEmail = order.customer?.email?.trim();

  // If customer did not provide an email, skip email sending
  if (!customerEmail || !customerEmail.includes('@')) {
    console.log(`[Customer Email Skipped]: Order #${order.orderId} — No email address provided`);
    if (order._id) {
      try {
        await Order.findByIdAndUpdate(order._id, { emailDeliveryStatus: 'Skipped' });
      } catch (err) {
        console.error('[Email Status Update Error]:', err.message);
      }
    }
    return { success: false, status: 'Skipped', reason: 'No email address provided' };
  }

  const senderUser = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'admin@quickfitmenswear.com';
  const customerName = order.customer?.name || 'Customer';
  const productNames = (order.items || [])
    .map((item) => `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`)
    .join(', ') || 'Item(s)';
  const totalAmount = order.totalAmount;
  const orderId = order.orderId;

  // Plain Text Version (Exact template required)
  const plainText = `Hello ${customerName},

Thank you for choosing QuickFit.

Your order has been successfully confirmed and is being processed.

Order Details:
- Order ID: ${orderId}
- Product(s): ${productNames}
- Total Amount: ₹${totalAmount}

We will notify you once your order is dispatched.

Thank you for shopping with QuickFit.

Team QuickFit`;

  // Rich HTML Version
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);border:1px solid #e4e4e7;">
          <!-- Header -->
          <tr>
            <td style="background-color:#09090b;padding:24px 30px;text-align:left;">
              <div style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">QUICKFIT</div>
              <div style="font-size:11px;color:#a1a1aa;margin-top:2px;">Hyperlocal Express Fashion Delivery</div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:30px;color:#18181b;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:700;color:#09090b;">Hello ${customerName},</p>
              
              <p style="margin:0 0 16px 0;">Thank you for choosing <strong>QuickFit</strong>.</p>
              
              <p style="margin:0 0 24px 0;">Your order has been successfully confirmed and is being processed.</p>
              
              <!-- Order Details Box -->
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#475569;margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Order Details</div>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr>
                    <td style="padding:6px 0;color:#64748b;width:35%;">Order ID:</td>
                    <td style="padding:6px 0;font-weight:700;color:#0f172a;font-family:monospace;">${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;vertical-align:top;">Product(s):</td>
                    <td style="padding:6px 0;font-weight:600;color:#0f172a;">${productNames}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;">Total Amount:</td>
                    <td style="padding:6px 0;font-weight:800;color:#0f172a;font-size:16px;">₹${totalAmount}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin:0 0 24px 0;color:#334155;">We will notify you once your order is dispatched.</p>
              
              <p style="margin:0 0 8px 0;color:#334155;">Thank you for shopping with QuickFit.</p>
              
              <p style="margin:0;font-weight:700;color:#09090b;">Team QuickFit</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:16px 30px;text-align:center;border-top:1px solid #f4f4f5;font-size:11px;color:#71717a;">
              QuickFit Menswear — Express Fashion Delivered to Your Doorstep
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const mailOptions = {
    from: `"QuickFit" <${senderUser}>`,
    to: customerEmail,
    subject: "QuickFit Order Confirmation",
    text: plainText,
    html: htmlBody
  };

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || senderUser,
      pass: process.env.EMAIL_PASS || ''
    }
  });

  try {
    if (process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'mock_email_pass') {
      await transporter.sendMail(mailOptions);
      console.log(`[Customer Email Sent]: Order #${orderId} confirmation sent to ${customerEmail}`);
    } else {
      console.log(`[Customer Email Mocked]: Order #${orderId} confirmation prepared for ${customerEmail} (Set EMAIL_PASS in .env to send live emails)`);
    }

    if (order._id) {
      await Order.findByIdAndUpdate(order._id, { emailDeliveryStatus: 'Sent' });
    }
    return { success: true, status: 'Sent' };
  } catch (error) {
    console.error(`[Customer Email Failed]: Order #${orderId} to ${customerEmail} — ${error.message}`);
    if (order._id) {
      try {
        await Order.findByIdAndUpdate(order._id, { emailDeliveryStatus: 'Failed' });
      } catch (dbErr) {
        console.error('[Email Status Update Error]:', dbErr.message);
      }
    }
    return { success: false, status: 'Failed', error: error.message };
  }
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

  // Build per-product blocks with image URL prominently displayed
  const itemBlocks = (order.items || []).map((item, idx) => {
    const imgUrl = resolvePublicImageUrl(item.images?.front || item.image || item.imageUrl || '');
    const colorLine = item.color ? `\nColor: ${item.color}` : '';
    const qty = item.quantity || 1;
    const lineTotal = (item.price || 0) * qty;

    return (
      `─────────────────────\n` +
      `*${idx + 1}. ${item.name}*\n\n` +
      `🖼️ *Product Image:*\n` +
      `${imgUrl}\n\n` +
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
    const imgUrl = resolvePublicImageUrl(item.images?.front || item.image || item.imageUrl || '');
    const colorLine = item.color ? `\nColor: ${item.color}` : '';
    const qty = item.quantity || 1;
    const lineTotal = (item.price || 0) * qty;

    return (
      `─────────────────────\n` +
      `*${idx + 1}. ${item.name}*\n\n` +
      `🖼️ *Product Image:*\n` +
      `${imgUrl}\n\n` +
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
