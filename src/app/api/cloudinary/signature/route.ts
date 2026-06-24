import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import {
  buildCloudinarySignature,
  CLOUDINARY_PRODUCT_FOLDER,
  CLOUDINARY_PRODUCT_TRANSFORM,
} from '@/lib/cloudinary';

export async function POST() {
  try {
    await requireUser();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = CLOUDINARY_PRODUCT_FOLDER;
    const eager = CLOUDINARY_PRODUCT_TRANSFORM;
    const signature = buildCloudinarySignature(
      {
        folder,
        timestamp,
        eager,
      },
      apiSecret
    );

    return NextResponse.json({
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
      eager,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
