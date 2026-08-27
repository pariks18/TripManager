import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary securely on the backend
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export async function uploadToCloudinary(
  fileInput: string,
  folder: string = 'memories'
): Promise<CloudinaryUploadResult> {
  const folderPath = `trip-manager/${folder}`;

  // Upload asset to Cloudinary
  const res = await cloudinary.uploader.upload(fileInput, {
    folder: folderPath,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'pdf'],
  });

  return {
    publicId: res.public_id,
    secureUrl: res.secure_url,
    format: res.format,
    width: res.width,
    height: res.height,
    bytes: res.bytes,
  };
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (error) {
    console.error('Error deleting Cloudinary asset:', error);
    return false;
  }
}

export { cloudinary };
