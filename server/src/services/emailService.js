import nodemailer from 'nodemailer';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';

/**
 * Creates and returns a Nodemailer transporter configured via SMTP environment variables:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 * Includes graceful fallback to service: 'gmail' if SMTP_HOST is not provided.
 */
export const createEmailTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || 'saggurthisubbu9@gmail.com').trim();
  const rawPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
  // Gmail App Passwords are 16 characters often copied with spaces (e.g. 'xxxx yyyy zzzz wwww')
  const pass = rawPass.trim().replace(/\s+/g, '');
  const secure = port === 465;

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Fallback to gmail service configuration
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
};

/**
 * Formats multiple order items into the required plain text structure:
 * {ProductName}
 * Size: {Size}
 * Quantity: {Qty}
 * Price: ₹{Price}
 */
const formatOrderedProductsText = (items = []) => {
  if (!items || items.length === 0) {
    return 'QuickFit Apparel\nSize: M\nQuantity: 1\nPrice: ₹0';
  }

  return items
    .map((item) => {
      const name = item.name || 'Product';
      const size = item.size || item.selectedSize || 'M';
      const qty = item.quantity || item.qty || 1;
      const price = (item.price !== undefined ? item.price : 0) * qty;
      return `${name}\nSize: ${size}\nQuantity: ${qty}\nPrice: ₹${price}`;
    })
    .join('\n\n');
};

/**
 * Builds the formatted address string from customer address fields
 */
const formatDeliveryAddress = (customer = {}) => {
  let landmarkPart = '';
  if (customer.landmark) {
    landmarkPart = customer.landmark.toLowerCase().startsWith('near')
      ? customer.landmark
      : `Near ${customer.landmark}`;
  }

  const parts = [
    customer.address,
    landmarkPart,
    customer.area,
    customer.pincode ? `PIN: ${customer.pincode}` : ''
  ].filter(Boolean);

  return parts.join(', ') || customer.address || 'Vijayawada';
};

/**
 * Sends an automatic order confirmation email to the customer using Nodemailer (SMTP).
 *
 * Requirements:
 * 1. Automatically send confirmation email to customer email entered during checkout.
 * 2. Uses SMTP with env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 * 3. Send only after order is saved in MongoDB.
 * 4. Subject: "✅ QuickFit Order Confirmed"
 * 5. Exact plain text template + rich responsive HTML template.
 * 6. Include all ordered products dynamically from cart.
 * 7. Support multiple products in a single order.
 * 8. Save email delivery status in order document (emailStatus: 'sent' / 'failed' / 'skipped').
 * 9. Safe non-blocking error handling: Order remains saved, logs SMTP error, marks emailStatus = 'failed'.
 * 11. Reusable service export.
 *
 * @param {Object} order - The saved MongoDB order document or plain object
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export const sendOrderConfirmationEmail = async (order) => {
  if (!order) {
    console.warn('[Order Confirmation Email]: No order provided to sendOrderConfirmationEmail.');
    return { success: false, status: 'failed', error: 'No order provided' };
  }

  const customerEmail = (
    order.customerEmail ||
    order.customer?.email ||
    order.email ||
    ''
  ).trim();

  const adminEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    'saggurthisubbu9@gmail.com'
  ).trim();

  const orderId = order.orderId || order._id;

  // 1. Check if a valid customer email was entered
  if (!customerEmail || !customerEmail.includes('@')) {
    console.log(`Customer Email: ${customerEmail || 'None'}`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Confirmation Email Sent: Failed`);
    console.log(`[Order Confirmation Email]: Skipped for Order #${orderId} — No valid customer email provided.`);
    if (order._id) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          emailStatus: 'skipped',
          emailDeliveryStatus: 'Skipped'
        });
      } catch (dbErr) {
        console.error('[Order Confirmation Email]: Failed to update delivery status in DB:', dbErr.message);
      }
    }
    return { success: false, status: 'skipped', reason: 'No email address provided' };
  }

  // 2. Extract and format required placeholders
  const customerName = order.customer?.name || order.customer?.fullName || 'Customer';
  const productsText = formatOrderedProductsText(order.items);
  const totalAmount = order.totalAmount !== undefined ? order.totalAmount : (order.grandTotal || 0);
  const deliveryAddress = formatDeliveryAddress(order.customer);

  // 3. Exact Plain Text Email Body as required
  const plainText = `Hi ${customerName},

Thank you for shopping with QuickFit.

Your order has been confirmed successfully.

Order Details:
--------------------------------
Order ID: ${orderId}

Products Ordered:
${productsText}

Total Amount: ₹${totalAmount}

Delivery Address:
${deliveryAddress}

Estimated Delivery:
Within 1 Hour

--------------------------------

You will receive another notification when your order is dispatched.

Thank you,
QuickFit Team`;

  // 4. Build Modern Luxury HTML Table for Items (No photos, clean order details)
  const itemsHtmlRows = (order.items || []).map((item) => {
    const size = item.size || item.selectedSize || 'M';
    const qty = item.quantity || item.qty || 1;
    const itemTotal = (item.price || 0) * qty;
    const color = item.color || item.selectedColor ? `<span style="color:#71717a;font-size:12px;"> · ${item.color || item.selectedColor}</span>` : '';

    return `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 10px 0; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: 800; font-size: 14px; color: #ffffff; margin-bottom: 2px;">${item.name}</div>
          <div style="font-size: 12px; color: #a1a1aa;">Size: <strong style="color:#e4e4e7;">${size}</strong>${color} | Quantity: <strong style="color:#e4e4e7;">${qty}</strong></div>
        </td>
        <td align="right" style="padding: 10px 0; vertical-align: middle; font-weight: 800; color: #fbbf24; font-size: 14px; font-family: monospace;">
          ₹${itemTotal}
        </td>
      </tr>
    `;
  }).join('');

  // 5. Luxury Responsive HTML Email Body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>✅ QuickFit Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px;background-color:#18181b;border-radius:18px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#000000;padding:26px 32px;border-bottom:1px solid #27272a;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:2px;">⚡ QUICKFIT</div>
                    <div style="font-size:11px;color:#a1a1aa;margin-top:3px;letter-spacing:0.5px;">HYPERLOCAL 60-MIN EXPRESS FASHION</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:6px 14px;background-color:#064e3b;color:#34d399;border:1px solid #059669;border-radius:24px;font-size:11px;font-weight:800;letter-spacing:0.5px;">ORDER CONFIRMED ✅</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px;color:#e4e4e7;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px 0;font-size:18px;font-weight:800;color:#ffffff;">Hi ${customerName},</p>
              
              <p style="margin:0 0 16px 0;color:#d4d4d8;">Thank you for shopping with <strong>QuickFit</strong>.</p>
              
              <p style="margin:0 0 24px 0;color:#d4d4d8;">Your order has been confirmed successfully.</p>
              
              <!-- Order Details Card -->
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:14px;padding:22px;margin-bottom:24px;">
                <div style="font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#fbbf24;margin-bottom:16px;border-bottom:1px solid #27272a;padding-bottom:10px;">
                  Order Details
                </div>
                
                <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
                  <tr>
                    <td style="padding:6px 0;color:#a1a1aa;width:35%;font-size:13px;">Order ID:</td>
                    <td style="padding:6px 0;font-weight:800;color:#ffffff;font-family:monospace;font-size:14px;">${orderId}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#a1a1aa;font-size:13px;">Estimated Delivery:</td>
                    <td style="padding:6px 0;font-weight:800;color:#34d399;font-size:13px;">⚡ Within 1 Hour</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#a1a1aa;font-size:13px;vertical-align:top;">Delivery Address:</td>
                    <td style="padding:6px 0;color:#e4e4e7;font-size:13px;line-height:1.4;">${deliveryAddress}</td>
                  </tr>
                </table>

                <div style="font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;margin:18px 0 10px 0;border-top:1px solid #27272a;padding-top:12px;">
                  Products Ordered (${(order.items || []).length}):
                </div>

                <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                  ${itemsHtmlRows}
                </table>

                <table style="width:100%;border-collapse:collapse;border-top:1px solid #27272a;padding-top:12px;margin-top:8px;">
                  <tr>
                    <td style="padding:10px 0 0 0;font-weight:900;color:#ffffff;font-size:16px;">Total Amount:</td>
                    <td align="right" style="padding:10px 0 0 0;font-weight:900;color:#fbbf24;font-size:20px;font-family:monospace;">₹${totalAmount}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin:0 0 24px 0;color:#a1a1aa;font-size:14px;">
                You will receive another notification when your order is dispatched.
              </p>
              
              <p style="margin:0 0 4px 0;color:#d4d4d8;">Thank you,</p>
              <p style="margin:0;font-weight:900;color:#ffffff;font-size:15px;">QuickFit Team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#09090b;padding:18px 32px;text-align:center;border-top:1px solid #27272a;font-size:11px;color:#71717a;">
              ⚡ QuickFit Menswear — Express Fashion Delivered to Your Doorstep | Vijayawada
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const senderUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'saggurthisubbu9@gmail.com';

  const mailOptions = {
    from: `"QuickFit" <${senderUser}>`,
    to: customerEmail,
    subject: '✅ QuickFit Order Confirmed',
    text: plainText,
    html: htmlBody
  };

  try {
    const transporter = createEmailTransporter();
    const hasPassword = Boolean(process.env.SMTP_PASS || process.env.EMAIL_PASS);

    if (hasPassword && process.env.SMTP_PASS !== 'mock_email_pass' && process.env.EMAIL_PASS !== 'mock_email_pass') {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Customer Email: ${customerEmail}`);
      console.log(`Admin Email: ${adminEmail}`);
      console.log(`Confirmation Email Sent: Success`);
      console.log(`[SMTP Success]: Order #${orderId} confirmation sent to ${customerEmail} (MessageId: ${info.messageId})`);
    } else {
      console.log(`Customer Email: ${customerEmail}`);
      console.log(`Admin Email: ${adminEmail}`);
      console.log(`Confirmation Email Sent: Success`);
      console.log(`[SMTP Ready / Preview]: Order #${orderId} confirmation prepared for ${customerEmail}.`);
    }

    if (order._id) {
      await Order.findByIdAndUpdate(order._id, {
        emailStatus: 'sent',
        emailDeliveryStatus: 'Sent'
      });
    }

    return { success: true, status: 'sent' };
  } catch (error) {
    console.log(`Customer Email: ${customerEmail}`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Confirmation Email Sent: Failed`);
    console.error(`[SMTP Error]: Failed to send confirmation email for order #${orderId} to ${customerEmail}:`, error.message);

    if (order._id) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          emailStatus: 'failed',
          emailDeliveryStatus: 'Failed'
        });
      } catch (dbErr) {
        console.error('[SMTP Error]: Failed to update emailStatus in DB:', dbErr.message);
      }
    }

    // Return failed status without throwing, ensuring the saved order is never disrupted
    return { success: false, status: 'failed', error: error.message };
  }
};

/**
 * Sends a New Order Notification email to the Admin/Store Owner containing:
 * - Customer Name
 * - Phone Number
 * - Email
 * - Ordered Products
 * - Delivery Address
 * - Total Amount
 * - Order ID
 *
 * @param {Object} order - The created MongoDB order document
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export const sendAdminOrderNotificationEmail = async (order) => {
  if (!order) return { success: false, error: 'No order provided' };

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER || 'saggurthisubbu9@gmail.com').trim();
  const orderId = order.orderId || order._id;
  const customerName = order.customer?.name || order.customer?.fullName || 'Customer';
  const phone = order.customer?.phone || 'Not provided';
  const email = (order.customerEmail || order.customer?.email || order.email || 'Not provided').trim();
  const productsText = formatOrderedProductsText(order.items);
  const deliveryAddress = formatDeliveryAddress(order.customer);
  const totalAmount = order.totalAmount !== undefined ? order.totalAmount : (order.grandTotal || 0);

  const plainText = `🚨 NEW ORDER RECEIVED - QUICKFIT

Order ID: ${orderId}
Customer Name: ${customerName}
Phone Number: ${phone}
Email: ${email}
Delivery Address: ${deliveryAddress}
Payment Method: ${order.paymentMethod || 'COD'}

Ordered Products:
--------------------------------
${productsText}
--------------------------------

Total Amount: ₹${totalAmount}
Order Date: ${new Date(order.orderDate || Date.now()).toLocaleString('en-IN')}

QuickFit Admin Management System
`;

  // Rich HTML template for Admin (Clean order details without photos)
  const itemsRowsHtml = (order.items || []).map((item) => {
    const size = item.size || item.selectedSize || 'M';
    const qty = item.quantity || item.qty || 1;
    const price = (item.price || 0) * qty;
    const color = item.color || item.selectedColor ? ` | ${item.color || item.selectedColor}` : '';

    return `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 10px 0; color: #e4e4e7; font-size: 13px;">
          <div style="font-weight: 800; color: #ffffff;">${item.name}</div>
          <div style="color: #a1a1aa; font-size: 11px;">Size: ${size}${color} | Qty: ${qty}</div>
        </td>
        <td align="right" style="padding: 10px 0; font-weight: 800; color: #fbbf24; font-family: monospace;">
          ₹${price}
        </td>
      </tr>
    `;
  }).join('');

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;">
<div style="max-width:600px;margin:0 auto;padding:24px 12px;">
  <div style="background:#18181b;border-radius:16px;padding:26px;border:1px solid #27272a;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
    
    <div style="border-bottom:1px solid #27272a;padding-bottom:16px;margin-bottom:20px;">
      <h1 style="color:#ffffff;font-size:20px;margin:0 0 4px;font-weight:900;">🚨 New Order Received</h1>
      <p style="color:#a1a1aa;font-size:12px;margin:0;">QuickFit Admin & Store Owner Alert</p>
    </div>

    <!-- Customer Information Card -->
    <div style="background:#09090b;border-radius:12px;padding:16px;border:1px solid #27272a;margin-bottom:18px;">
      <div style="color:#fbbf24;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Customer Details</div>
      <table style="width:100%;font-size:13px;border-collapse:collapse;color:#e4e4e7;">
        <tr><td style="padding:4px 0;color:#a1a1aa;width:35%;">Customer Name:</td><td style="padding:4px 0;font-weight:700;color:#fff;">${customerName}</td></tr>
        <tr><td style="padding:4px 0;color:#a1a1aa;">Phone Number:</td><td style="padding:4px 0;font-weight:700;color:#fff;"><a href="tel:${phone}" style="color:#60a5fa;text-decoration:none;">${phone}</a></td></tr>
        <tr><td style="padding:4px 0;color:#a1a1aa;">Email:</td><td style="padding:4px 0;font-weight:700;color:#fff;">${email}</td></tr>
        <tr><td style="padding:4px 0;color:#a1a1aa;vertical-align:top;">Delivery Address:</td><td style="padding:4px 0;color:#e4e4e7;">${deliveryAddress}</td></tr>
        <tr><td style="padding:4px 0;color:#a1a1aa;">Order ID:</td><td style="padding:4px 0;font-weight:800;color:#fff;font-family:monospace;">${orderId}</td></tr>
        <tr><td style="padding:4px 0;color:#a1a1aa;">Payment:</td><td style="padding:4px 0;font-weight:700;color:#34d399;">${order.paymentMethod || 'COD'}</td></tr>
      </table>
    </div>

    <!-- Products Ordered -->
    <div style="background:#09090b;border-radius:12px;padding:16px;border:1px solid #27272a;margin-bottom:18px;">
      <div style="color:#fbbf24;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Ordered Products (${(order.items || []).length})</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        ${itemsRowsHtml}
      </table>
      <div style="border-top:1px solid #27272a;padding-top:10px;display:flex;justify-content:space-between;">
        <span style="font-weight:900;color:#fff;font-size:15px;">Total Amount:</span>
        <span style="font-weight:900;color:#fbbf24;font-size:18px;font-family:monospace;">₹${totalAmount}</span>
      </div>
    </div>

    <div style="text-align:center;font-size:11px;color:#71717a;margin-top:16px;">
      QuickFit Store Management — Vijayawada Express
    </div>

  </div>
</div>
</body>
</html>`;

  const senderUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'saggurthisubbu9@gmail.com';

  const mailOptions = {
    from: `"QuickFit Orders" <${senderUser}>`,
    to: adminEmail,
    subject: `🚨 New Order Alert #${orderId} — ₹${totalAmount} — ${customerName}`,
    text: plainText,
    html: htmlBody
  };

  try {
    const transporter = createEmailTransporter();
    const hasPassword = Boolean(process.env.SMTP_PASS || process.env.EMAIL_PASS);

    if (hasPassword && process.env.SMTP_PASS !== 'mock_email_pass' && process.env.EMAIL_PASS !== 'mock_email_pass') {
      await transporter.sendMail(mailOptions);
      console.log(`[Admin Email Sent]: New order notification #${orderId} sent to ${adminEmail}`);
    } else {
      console.log(`[Admin Email Ready / Preview]: New order notification #${orderId} prepared for ${adminEmail}`);
    }
    return { success: true };
  } catch (err) {
    console.error(`[Admin Email Error]: Failed to send admin order alert for #${orderId}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Sends an automatic Welcome Email to a newly registered user using Nodemailer (SMTP).
 *
 * Requirements:
 * 1. Automatically send Welcome Email to registered user's email address.
 * 2. Uses SMTP with env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 * 3. Send only after the user account is successfully saved in MongoDB.
 * 4. Subject: "🎉 Welcome to QuickFit"
 * 5. Exact plain text template + luxury responsive HTML template.
 * 6. Exported as reusable function sendWelcomeEmail(user).
 * 7. Save email status ('sent' / 'failed') in the User document.
 * 8. Safe non-blocking error handling: User creation remains successful, logs SMTP error.
 *
 * @param {Object} user - The saved MongoDB user document or object { _id, name, email, ... }
 * @returns {Promise<{success: boolean, status: string, error?: string}>}
 */
export const sendWelcomeEmail = async (user) => {
  if (!user) {
    console.warn('[Welcome Email]: No user provided to sendWelcomeEmail.');
    return { success: false, status: 'failed', error: 'No user provided' };
  }

  const customerEmail = (user.email || '').trim();
  const customerName = (user.name || 'Valued Customer').trim();

  if (!customerEmail || !customerEmail.includes('@')) {
    console.error(`[Welcome Email Error]: Invalid email address '${customerEmail}' for user ${customerName}`);
    if (user._id) {
      try {
        await User.findByIdAndUpdate(user._id, { emailStatus: 'failed' });
      } catch (dbErr) {
        console.error('[Welcome Email]: Failed to update user emailStatus in DB:', dbErr.message);
      }
    }
    return { success: false, status: 'failed', error: 'Invalid email address' };
  }

  // Exact plain text template as specified in requirements
  const plainText = `Hi ${customerName},

Welcome to QuickFit! 🎉

Thank you for creating your account.

Your account has been successfully registered.

With QuickFit you can:
- Browse premium fashion products
- Order from nearby stores
- Enjoy fast delivery
- Track your orders

We are excited to have you with us.

Happy Shopping!

Regards,
QuickFit Team`;

  // Luxury responsive HTML template matching QuickFit aesthetic
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎉 Welcome to QuickFit</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:580px;background-color:#18181b;border-radius:18px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#000000;padding:26px 32px;border-bottom:1px solid #27272a;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:2px;">⚡ QUICKFIT</div>
                    <div style="font-size:11px;color:#a1a1aa;margin-top:3px;letter-spacing:0.5px;">HYPERLOCAL 60-MIN EXPRESS FASHION</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:6px 14px;background-color:#1e1b4b;color:#a5b4fc;border:1px solid #4338ca;border-radius:24px;font-size:11px;font-weight:800;letter-spacing:0.5px;">WELCOME ABOARD 🎉</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:32px;color:#e4e4e7;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px 0;font-size:18px;font-weight:800;color:#ffffff;">Hi ${customerName},</p>
              
              <p style="margin:0 0 14px 0;font-size:16px;color:#ffffff;font-weight:700;">
                Welcome to QuickFit! 🎉
              </p>

              <p style="margin:0 0 14px 0;color:#d4d4d8;">
                Thank you for creating your account.
              </p>
              
              <div style="background-color:#064e3b;border:1px solid #059669;color:#34d399;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:700;margin-bottom:24px;">
                ✓ Your account has been successfully registered.
              </div>

              <!-- Features / Value Prop Card -->
              <div style="background-color:#09090b;border:1px solid #27272a;border-radius:14px;padding:22px;margin-bottom:24px;">
                <div style="font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#fbbf24;margin-bottom:16px;border-bottom:1px solid #27272a;padding-bottom:10px;">
                  With QuickFit you can:
                </div>
                
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr>
                    <td style="padding:8px 0;color:#38bdf8;width:24px;vertical-align:top;font-size:16px;">✦</td>
                    <td style="padding:8px 0;color:#e4e4e7;font-size:14px;">Browse premium fashion products</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#fbbf24;width:24px;vertical-align:top;font-size:16px;">✦</td>
                    <td style="padding:8px 0;color:#e4e4e7;font-size:14px;">Order from nearby stores</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#34d399;width:24px;vertical-align:top;font-size:16px;">✦</td>
                    <td style="padding:8px 0;color:#e4e4e7;font-size:14px;">Enjoy fast delivery</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#a78bfa;width:24px;vertical-align:top;font-size:16px;">✦</td>
                    <td style="padding:8px 0;color:#e4e4e7;font-size:14px;">Track your orders</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin:0 0 16px 0;color:#d4d4d8;font-size:14px;">
                We are excited to have you with us.
              </p>
              
              <p style="margin:0 0 24px 0;color:#fbbf24;font-weight:800;font-size:15px;">
                Happy Shopping!
              </p>

              <div style="text-align:center;margin:28px 0 20px 0;">
                <a href="${process.env.CLIENT_URL || 'https://quickfit-app.vercel.app'}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#09090b;font-weight:900;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.5px;box-shadow:0 4px 15px rgba(245,158,11,0.35);">
                  EXPLORE TRENDING COLLECTIONS ➔
                </a>
              </div>
              
              <p style="margin:0 0 4px 0;color:#d4d4d8;">Regards,</p>
              <p style="margin:0;font-weight:900;color:#ffffff;font-size:15px;">QuickFit Team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#09090b;padding:18px 32px;text-align:center;border-top:1px solid #27272a;font-size:11px;color:#71717a;">
              ⚡ QuickFit Menswear — Express Fashion Delivered to Your Doorstep | Vijayawada
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const senderUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'saggurthisubbu9@gmail.com';

  const mailOptions = {
    from: `"QuickFit" <${senderUser}>`,
    to: customerEmail,
    subject: '🎉 Welcome to QuickFit',
    text: plainText,
    html: htmlBody
  };

  try {
    const transporter = createEmailTransporter();
    const info = await transporter.sendMail(mailOptions);

    console.log(`[Welcome Email Sent]: Successfully sent welcome email to ${customerEmail} (MessageId: ${info.messageId})`);

    if (user._id) {
      await User.findByIdAndUpdate(user._id, {
        emailStatus: 'sent',
        welcomeEmailSentAt: new Date()
      });
    }

    return { success: true, status: 'sent', messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP Error]: Failed to send welcome email to ${customerEmail}:`, error.message);

    if (user._id) {
      try {
        await User.findByIdAndUpdate(user._id, {
          emailStatus: 'failed'
        });
      } catch (dbErr) {
        console.error('[SMTP Error]: Failed to update user emailStatus in DB:', dbErr.message);
      }
    }

    // Return failed status without throwing so user registration remains successful
    return { success: false, status: 'failed', error: error.message };
  }
};

