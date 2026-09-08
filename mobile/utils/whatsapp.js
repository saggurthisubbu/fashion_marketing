// QuickFit WhatsApp & Business Notification Service — Mobile Port
// Pure JS, no DOM dependencies. Direct port from web utils/whatsapp.js

export const WHATSAPP_BUSINESS_PHONE = "917396629821";
export const BUSINESS_SUPPORT_EMAIL  = "support@quickfitmenswear.com";

const BACKEND_ORIGIN = 'https://quickfit-backend-m1yl.onrender.com';
const DEFAULT_PRODUCT_IMAGE_URL =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';

export const getPublicProductImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') return DEFAULT_PRODUCT_IMAGE_URL;
  const src = imagePath.trim();
  if (src.startsWith('blob:') || src.startsWith('data:')) return DEFAULT_PRODUCT_IMAGE_URL;
  if (src.includes('localhost') || src.includes('127.0.0.1')) {
    const match = src.match(/\/uploads\/.+/);
    return match ? `${BACKEND_ORIGIN}${match[0]}` : DEFAULT_PRODUCT_IMAGE_URL;
  }
  if (/^https?:\/\//i.test(src)) {
    if (src.includes('/uploads/')) {
      const rel = '/uploads/' + src.split('/uploads/')[1];
      return `${BACKEND_ORIGIN}${rel}`;
    }
    return src;
  }
  if (src.startsWith('/uploads/') || src.startsWith('uploads/')) {
    const clean = src.startsWith('/') ? src : `/${src}`;
    return `${BACKEND_ORIGIN}${clean}`;
  }
  if (src.startsWith('/')) return `${BACKEND_ORIGIN}${src}`;
  return DEFAULT_PRODUCT_IMAGE_URL;
};

const buildDeliveryAddress = (customer) =>
  [
    customer?.address || customer?.fullAddress || '',
    customer?.landmark ? `Near ${customer.landmark}` : '',
    customer?.area || '',
    customer?.pincode ? `- ${customer.pincode}` : '',
  ].filter(Boolean).join(', ') || 'To be confirmed on chat';

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
  locationLink = 'Not provided',
}) => {
  const colorLine = color ? `\n*Color:* ${color}` : '';
  const totalPrice = price * quantity;
  const message =
    `*Order Confirmed — QuickFit Menswear*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `*Product:* ${productName}\n` +
    `*Size:* ${size}${colorLine}\n` +
    `*Quantity:* ${quantity}\n` +
    `*Price:* Rs.${price} x ${quantity} = Rs.${totalPrice}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Total:* Rs.${totalPrice}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Customer:* ${customerName}\n` +
    `*Phone:* ${customerPhone || 'To be provided'}\n` +
    `*Address:* ${address || 'To be confirmed on chat'}\n` +
    `*Location:* ${locationLink}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `QuickFit — Vijayawada Express Delivery\n` +
    `Please confirm availability and dispatch.`;
  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message)}`;
};

export const formatSingleProductWhatsApp = (product, selectedSize = 'M') => {
  const imageUrl = product?.images?.front || product?.image || '';
  return formatQuickFitWhatsAppOrder({
    customerName: 'Valued Customer',
    productName: product?.name || "Men's Apparel",
    size: selectedSize,
    quantity: 1,
    price: product?.price || 0,
    imageUrl,
    address: '',
    locationLink: 'Not provided',
  });
};

export const formatFullOrderWhatsApp = (orderData) => {
  const { orderId, customer, items, subtotal, discount, deliveryFee, grandTotal, paymentMethod, locationLink } = orderData;
  const itemBlocks = (items || [])
    .map((item, idx) => {
      const colorLine = item.selectedColor || item.color ? `\n*Color:* ${item.selectedColor || item.color}` : '';
      const sizePart = item.selectedSize || item.size || 'M';
      const qty = item.quantity || 1;
      const lineTotal = (item.price || 0) * qty;
      return (
        `─────────────────────\n` +
        `*${idx + 1}. ${item.name}*\n` +
        `*Size:* ${sizePart}${colorLine}\n` +
        `*Quantity:* ${qty}\n` +
        `*Price:* Rs.${item.price} x ${qty} = Rs.${lineTotal}`
      );
    })
    .join('\n\n');
  const deliveryAddress = buildDeliveryAddress(customer);
  const discountLine = discount && discount > 0 ? `\n*Discount:* -Rs.${discount}` : '';
  const deliveryLine = deliveryFee !== undefined ? `\n*Delivery:* Rs.${deliveryFee}` : '';
  const message =
    `*Order Confirmed — QuickFit Menswear*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `*Order ID:* ${orderId || 'QF-PENDING'}\n\n` +
    `*Items Ordered (${(items || []).length})*\n` +
    `${itemBlocks}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Subtotal:* Rs.${subtotal || grandTotal}${discountLine}${deliveryLine}\n` +
    `*Payment:* ${paymentMethod || 'COD'}\n` +
    `*Total:* Rs.${grandTotal}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `*Customer:* ${customer?.fullName || customer?.name || 'Valued Customer'}\n` +
    `*Phone:* ${customer?.phone || 'Not specified'}\n` +
    `*Address:* ${deliveryAddress}\n` +
    `*Location:* ${locationLink || customer?.locationLink || 'Not provided'}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `QuickFit — Vijayawada Express Delivery\n` +
    `Please confirm availability and dispatch.`;
  return `https://wa.me/${WHATSAPP_BUSINESS_PHONE}?text=${encodeURIComponent(message)}`;
};
