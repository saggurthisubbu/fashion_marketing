import nodemailer from 'nodemailer';

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
