// QuickFit Official WhatsApp & Business Notification Service

export const WHATSAPP_BUSINESS_PHONE = "917396629821";
export const BUSINESS_SUPPORT_EMAIL = "support@quickfitmenswear.com";

/**
 * Formats standard QuickFit WhatsApp order message with customer details and GPS location
 */
export const formatQuickFitWhatsAppOrder = ({
  customerName = "Valued Customer",
  customerPhone = "",
  productName = "Men's Apparel",
  size = "M",
  quantity = 1,
  price = 0,
  address = "",
  locationLink = "Not provided"
}) => {
  const message = `Hello QuickFit,

I would like to place an order.

Name: ${customerName}
Phone: ${customerPhone || 'Not specified'}
Product: ${productName}
Size: ${size}
Quantity: ${quantity}
Price: ₹${price}

Delivery Address:
${address || 'Address to be confirmed on chat'}

Current Location:
${locationLink}

Please confirm availability.`;

  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message)}`;
};

/**
 * Backward-compatible single product helper
 */
export const formatSingleProductWhatsApp = (product, selectedSize = "M") => {
  return formatQuickFitWhatsAppOrder({
    customerName: "Valued Customer",
    productName: product?.name || "Men's Apparel",
    size: selectedSize,
    quantity: 1,
    price: product?.price || 0,
    address: "",
    locationLink: "Not provided"
  });
};

/**
 * Formats multi-item bag WhatsApp checkout URL
 */
export const formatFullOrderWhatsApp = (orderData) => {
  const { orderId, customer, items, grandTotal, paymentMethod, locationLink } = orderData;

  const itemLines = items.map((item, idx) => {
    return `${idx + 1}. *${item.name}* (Size: ${item.selectedSize || "M"}${item.selectedColor ? `, Color: ${item.selectedColor}` : ""}) x ${item.quantity} = ₹${item.price * item.quantity}`;
  }).join("\n");

  const message = `Hello QuickFit,

I would like to place an order.

Order ID: ${orderId}
Name: ${customer.fullName || customer.name || 'Valued Customer'}
Phone: ${customer.phone || 'Not specified'}
Items:
${itemLines}

Total Price: ₹${grandTotal}
Payment Mode: ${paymentMethod}

Delivery Address:
${customer.address || ''}, ${customer.area || ''} ${customer.pincode ? `- ${customer.pincode}` : ''}

Current Location:
${locationLink || customer.locationLink || 'Not provided'}

Please confirm availability and dispatch my order.`;

  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message)}`;
};
