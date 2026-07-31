export const WHATSAPP_NUMBER = "917396629821";
export const NOTIFICATION_EMAIL = "saggurthisubbu9@gmail.com";

/**
 * Formats a single item WhatsApp direct order URL
 */
export const formatSingleProductWhatsApp = (product, selectedSize = "M", selectedColor = "") => {
  const colorText = selectedColor ? ` | Color: ${selectedColor}` : "";
  const message = `👋 Hi QuickFit Vijayawada! I want to order this item for 60-Minute Express Delivery:

🛍️ *Product:* ${product.name}
🆔 *Product ID:* ${product.id}
💰 *Price:* ₹${product.price} (Original: ₹${product.originalPrice})
📏 *Size:* ${selectedSize}${colorText}
🏬 *Boutique:* ${product.boutique}
⚡ *Delivery:* ${product.expressDelivery}

📍 *Location:* Vijayawada (Within 5 KM Radius)

Please confirm availability and dispatch my express rider!`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

/**
 * Formats a full order WhatsApp checkout URL with Order ID
 */
export const formatFullOrderWhatsApp = (orderData) => {
  const { orderId, customer, items, subtotal, discount, deliveryFee, grandTotal, paymentMethod } = orderData;

  let itemLines = items.map((item, idx) => {
    return `${idx + 1}. *${item.name}* (Size: ${item.selectedSize || "M"}${item.selectedColor ? `, Color: ${item.selectedColor}` : ""}) x ${item.quantity} = ₹${item.price * item.quantity}`;
  }).join("\n");

  const message = `🎉 *NEW EXPRESS ORDER - QUICKFIT VIJAYAWADA* 🎉

📋 *Order ID:* ${orderId}
⚡ *Delivery Promise:* Within 60 Minutes

👤 *Customer Details:*
- *Name:* ${customer.fullName}
- *Phone:* ${customer.phone}
- *Email:* ${customer.email}
- *Delivery Address:* ${customer.address}, ${customer.landmark}
- *Pincode:* ${customer.pincode} (Vijayawada)

🛒 *Ordered Items:*
${itemLines}

💵 *Payment Summary:*
- Subtotal: ₹${subtotal}
- Discount: -₹${discount}
- Delivery Fee: ${deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
- *GRAND TOTAL:* ₹${grandTotal}
- *Payment Mode:* ${paymentMethod}

🚀 Please dispatch rider from nearest Vijayawada boutique!`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

/**
 * Pre-fills mailto URL for sending email notification to saggurthisubbu9@gmail.com
 */
export const formatMailtoNotification = (orderData) => {
  const { orderId, customer, items, grandTotal, paymentMethod } = orderData;
  const subject = `[QuickFit Order] New 60-Min Express Order #${orderId} - ₹${grandTotal}`;
  const body = `New QuickFit Order Details:

Order ID: ${orderId}
Customer Name: ${customer.fullName}
Phone: ${customer.phone}
Email: ${customer.email}
Address: ${customer.address}, ${customer.landmark}, Vijayawada - ${customer.pincode}
Payment Method: ${paymentMethod}
Grand Total: ₹${grandTotal}

Items:
${items.map(i => `- ${i.name} (Size: ${i.selectedSize || 'M'}) x ${i.quantity} = ₹${i.price * i.quantity}`).join('\n')}

Delivered within 60 Minutes!`;

  return `mailto:${NOTIFICATION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
