import nodemailer from 'nodemailer';

export const sendEmailNotification = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@quickfitmenswear.com';
  
  // Configure transporter (works with Gmail App Password or fallback logger)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || adminEmail,
      pass: process.env.EMAIL_PASS || ''
    }
  });

  const itemsListText = order.items.map(item => `- ${item.name} (${item.size || 'M'}) x${item.quantity} = ₹${item.price * item.quantity}`).join('\n');

  const mailOptions = {
    from: `"QuickFit Orders" <${process.env.EMAIL_USER || adminEmail}>`,
    to: adminEmail,
    subject: `🚨 NEW QUICKFIT ORDER RECEIVED: #${order.orderId} (₹${order.totalAmount})`,
    text: `
NEW QUICKFIT ORDER RECEIVED!

Order ID: ${order.orderId}
Customer Name: ${order.customer.name}
Phone: ${order.customer.phone}
Email: ${order.customer.email || 'Not provided'}
Delivery Address: ${order.customer.address}, ${order.customer.landmark || ''}, ${order.customer.area}, ${order.customer.pincode}
Location Link: ${order.locationLink || 'Not provided'}
Payment Method: ${order.paymentMethod}

ORDER ITEMS:
${itemsListText}

Total Amount: ₹${order.totalAmount}
Order Date: ${new Date(order.orderDate).toLocaleString('en-IN')}

QuickFit Menswear Vijayawada
`
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

export const getWhatsAppOrderUrl = (order) => {
  const phone = process.env.WHATSAPP_PHONE || '917396629821';
  const itemsText = order.items.map(item => `• *${item.name}* (Size: ${item.size || 'M'}, Qty: ${item.quantity}) - ₹${item.price}`).join('%0A');
  
  const text = `🛍️ *New QuickFit Order Received*%0A%0A` +
    `*Order ID:* ${order.orderId}%0A` +
    `*Customer Name:* ${encodeURIComponent(order.customer.name)}%0A` +
    `*Phone:* ${order.customer.phone}%0A` +
    `*Address:* ${encodeURIComponent(order.customer.address)}, ${encodeURIComponent(order.customer.area)}%0A` +
    `*Location Link:* ${encodeURIComponent(order.locationLink || 'Not provided')}%0A` +
    `*Payment Method:* ${order.paymentMethod}%0A%0A` +
    `*Products:*%0A${itemsText}%0A%0A` +
    `*Total Amount:* ₹${order.totalAmount}%0A%0A` +
    `🚀 *Vijayawada Express Delivery*`;

  return `https://wa.me/${phone}?text=${text}`;
};
