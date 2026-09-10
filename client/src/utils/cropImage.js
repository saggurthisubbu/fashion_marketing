/**
 * Utility to create an HTML Image object asynchronously with crossOrigin setting
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Set crossOrigin to anonymous to avoid tainted canvas issues with external images
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area size of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Crops an image based on pixel crop specs from react-easy-crop and rotation angle.
 * Returns { file, url, dataUrl } with high quality rendering.
 */
export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  fileName = 'cropped_product_image.jpg'
) {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    const rotRad = getRadianAngle(rotation);

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set main canvas size to match the rotated bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Translate canvas center to image center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    // Create target cropped canvas matching requested pixelCrop size
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
      throw new Error('Failed to get 2D context for cropped canvas');
    }

    // Ensure non-zero crop dimensions
    const cropWidth = Math.max(1, Math.round(pixelCrop.width));
    const cropHeight = Math.max(1, Math.round(pixelCrop.height));

    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    croppedCtx.imageSmoothingEnabled = true;
    croppedCtx.imageSmoothingQuality = 'high';

    // Draw the cropped region from main canvas onto cropped canvas
    croppedCtx.drawImage(
      canvas,
      Math.round(pixelCrop.x),
      Math.round(pixelCrop.y),
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // Convert cropped canvas to High Quality Blob and DataURL
    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas export returned null blob'));
            return;
          }
          const file = new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });
          const url = URL.createObjectURL(blob);
          const dataUrl = croppedCanvas.toDataURL('image/jpeg', 0.95);
          resolve({ file, url, dataUrl });
        },
        'image/jpeg',
        0.95
      );
    });
  } catch (error) {
    console.error('[getCroppedImg Error]', error);
    throw error;
  }
}
