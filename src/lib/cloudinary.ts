import { createHash } from 'crypto';

type SignatureValue = string | number | boolean | undefined | null;

export { CLOUDINARY_PRODUCT_FOLDER, CLOUDINARY_PRODUCT_TRANSFORM } from './cloudinary-image';

export function buildCloudinarySignature(
  params: Record<string, SignatureValue>,
  apiSecret: string
) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}
