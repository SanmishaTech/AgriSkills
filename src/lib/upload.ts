import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadConfig {
  allowedTypes: string[];
  maxSize: number;
  uploadDir: string;
}

export interface UploadResult {
  success: boolean;
  filePath?: string;
  publicUrl?: string;
  error?: string;
}

export const uploadConfig: UploadConfig = {
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  maxSize: 5 * 1024 * 1024, // 5MB
  uploadDir: 'uploads/profiles', // This will be relative to project root, not public
};

export async function handleFileUpload(
  file: File,
  userId: string,
  config: UploadConfig = uploadConfig
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`,
      };
    }

    // Validate file size
    if (file.size > config.maxSize) {
      return {
        success: false,
        error: `File too large. Maximum size: ${(config.maxSize / (1024 * 1024)).toFixed(2)}MB`,
      };
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueId = uuidv4();
    const filename = `${userId}_${uniqueId}${fileExtension}`;

    // Create upload directory if it doesn't exist (outside public folder)
    const uploadPath = path.join(process.cwd(), config.uploadDir);
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // Full file path
    const filePath = path.join(uploadPath, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    return {
      success: true,
      filePath,
      publicUrl: filename, // Store only filename, construct API URL when needed
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file',
    };
  }
}

export async function deleteFile(apiUrl: string): Promise<boolean> {
  try {
    const { unlink } = await import('fs/promises');
    // Extract filename from API URL (/api/images/filename.jpg -> filename.jpg)
    const filename = apiUrl.split('/').pop();
    if (!filename) return false;
    
    const fullPath = path.join(process.cwd(), 'uploads/profiles', filename);
    
    if (existsSync(fullPath)) {
      await unlink(fullPath);
      return true;
    }
    return true; // File doesn't exist, consider it deleted
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
}
