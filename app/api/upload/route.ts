import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { image, folder = 'memories' } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Basic MIME / Format Validation
    const isDataUri = image.startsWith('data:');
    const isHttpUrl = image.startsWith('http://') || image.startsWith('https://');

    if (!isDataUri && !isHttpUrl) {
      return NextResponse.json({ error: 'Invalid image payload format' }, { status: 400 });
    }

    // Size limit check for Data URIs (~10MB limit)
    if (isDataUri && image.length > 14 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image file size exceeds maximum 10MB limit' }, { status: 400 });
    }

    // Check if Cloudinary environment variables are configured
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      const result = await uploadToCloudinary(image, folder);
      return NextResponse.json({
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    }

    // Dev fallback if Cloudinary credentials not configured yet
    return NextResponse.json({
      publicId: `fallback_${Date.now()}`,
      secureUrl: image,
      format: 'jpeg',
      width: 800,
      height: 600,
      bytes: image.length,
    });
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ error: 'Missing publicId' }, { status: 400 });
    }

    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      const success = await deleteFromCloudinary(publicId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting image from Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete image' }, { status: 500 });
  }
}
