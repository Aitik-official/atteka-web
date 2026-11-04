import fs from "fs";
import path from "path";

/**
 * Storage Service Adapter
 * Handles local document/POD uploads with persistent storage.
 * Cloudinary / S3 adapters can plug in via the same interface.
 */

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface IStorageService {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    const timestamp = Date.now();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}_${sanitizedName}`;
    const targetPath = path.join(this.uploadDir, uniqueFileName);

    await fs.promises.writeFile(targetPath, fileBuffer);

    return {
      fileUrl: `/uploads/${uniqueFileName}`,
      fileName: sanitizedName,
      fileSize: fileBuffer.length,
      mimeType
    };
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const fileName = path.basename(fileUrl);
      const targetPath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService: IStorageService = new LocalStorageService();

