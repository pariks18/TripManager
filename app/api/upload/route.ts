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
    const { image, file, folder = 'memories' } = body;
    const filePayload = image || file;

    if (!filePayload || typeof filePayload !== 'string') {
      return NextResponse.json({ error: 'File data is required' }, { status: 400 });
    }

    // Basic MIME / Format Validation
    const isDataUri = filePayload.startsWith('data:');
    const isHttpUrl = filePayload.startsWith('http://') || filePayload.startsWith('https://');

    if (!isDataUri && !isHttpUrl) {
      return NextResponse.json({ error: 'Invalid file payload format' }, { status: 400 });
    }

    // Size limit check for Data URIs (~10MB limit)
    if (isDataUri && filePayload.length > 14 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds maximum 10MB limit' }, { status: 400 });
    }

    // Check if Cloudinary environment variables are configured
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinary) {
      const result = await uploadToCloudinary(filePayload, folder);
      return NextResponse.json({
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });
    }

    const isPdf = filePayload.startsWith('data:application/pdf') || filePayload.toLowerCase().includes('.pdf');

    // Dev fallback if Cloudinary credentials not configured yet
    return NextResponse.json({
      publicId: `fallback_${Date.now()}`,
      secureUrl: filePayload,
      format: isPdf ? 'pdf' : 'jpeg',
      width: 800,
      height: 600,
      bytes: filePayload.length,
    });
  } catch (error: any) {
    console.error('Error uploading file to Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
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
