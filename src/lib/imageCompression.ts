/**
 * Client-side image compression for recipe uploads.
 *
 * Downscales images to max 1600px width/height and re-encodes to JPEG (~0.8 quality).
 * Prevents raw phone camera uploads (4-12MB) from exhausting storage & bandwidth.
 */

export async function compressImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.8
): Promise<File> {
  // Fallback if executed in a non-browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  // SVGs or files under 150KB don't need compression
  if (file.type === 'image/svg+xml' || file.size < 150 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const extension = mimeType === 'image/png' ? '.png' : '.jpg';
          const newName = file.name.replace(/\.[^/.]+$/, '') + extension;
          const compressedFile = new File([blob], newName, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
