export const CLOUDINARY_PRODUCT_FOLDER = 'stockma/products';
export const CLOUDINARY_PRODUCT_TRANSFORM = 'c_fill,g_auto,w_800,h_800,f_auto,q_auto';

export function buildCloudinaryImageUrl(
  url: string | null | undefined,
  options: { width: number; height: number }
) {
  if (!url) return null;

  const transformation = `c_fill,g_auto,w_${options.width},h_${options.height},f_auto,q_auto`;
  return url.replace(
    /(\/image\/upload\/)(?:[^/]+\/)?(v\d+\/.*)$/,
    `$1${transformation}/$2`
  );
}
