import { describe, expect, it } from 'vitest';
import { buildCloudinarySignature } from '../cloudinary';
import { buildCloudinaryImageUrl } from '../cloudinary-image';

describe('cloudinary helpers', () => {
  it('signs upload parameters with Cloudinary canonical ordering', () => {
    const signature = buildCloudinarySignature(
      {
        folder: 'stockma/products',
        timestamp: 1_717_171_717,
        eager: 'c_fill,w_320,h_320,g_auto/f_auto,q_auto',
      },
      'secret'
    );

    expect(signature).toBe('776170c817090ddbbf47f88a7e132aa78e378733');
  });

  it('builds cropped, optimized Cloudinary image URLs from secure upload URLs', () => {
    const url = buildCloudinaryImageUrl(
      'https://res.cloudinary.com/demo/image/upload/v1717171717/stockma/products/sample.jpg',
      { width: 96, height: 96 }
    );

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_96,h_96,f_auto,q_auto/v1717171717/stockma/products/sample.jpg'
    );
  });

  it('replaces existing Cloudinary upload transformations for the requested display size', () => {
    const url = buildCloudinaryImageUrl(
      'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_800,h_800,f_auto,q_auto/v1717171717/stockma/products/sample.jpg',
      { width: 96, height: 96 }
    );

    expect(url).toBe(
      'https://res.cloudinary.com/demo/image/upload/c_fill,g_auto,w_96,h_96,f_auto,q_auto/v1717171717/stockma/products/sample.jpg'
    );
  });
});
