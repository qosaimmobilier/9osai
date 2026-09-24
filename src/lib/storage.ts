import { supabase, PROPERTY_IMAGE_BUCKET, PROPERTY_VIDEO_BUCKET } from '@/lib/supabase';

export async function uploadPropertyImage(
  userId: string,
  propertyId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const path = `${userId}/${propertyId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(PROPERTY_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Image upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(PROPERTY_IMAGE_BUCKET)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}

export async function uploadPropertyVideo(
  userId: string,
  propertyId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const path = `${userId}/${propertyId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(PROPERTY_VIDEO_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Video upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(PROPERTY_VIDEO_BUCKET)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path };
}

export async function deleteStorageFile(
  bucket: string,
  path: string
): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

export function validateImageFile(file: File, maxSizeMb: number): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return 'نوع الملف غير مسموح. يُسمح بـ: JPG, PNG, WebP, GIF';
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `حجم الملف كبير جدًا. الحد الأقصى ${maxSizeMb} ميجابايت`;
  }
  return null;
}

export function validateVideoFile(file: File, maxSizeMb: number): string | null {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  if (!allowedTypes.includes(file.type)) {
    return 'نوع الفيديو غير مسموح. يُسمح بـ: MP4, WebM, MOV';
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `حجم الفيديو كبير جدًا. الحد الأقصى ${maxSizeMb} ميجابايت`;
  }
  return null;
}
