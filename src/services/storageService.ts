import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Storage Service Adapter
 * Supports both Local Disk Storage and Cloudinary Cloud Storage.
 */

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  provider: "local" | "cloudinary";
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
      mimeType,
      provider: "local"
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

export class CloudinaryStorageService implements IStorageService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;
  private folder: string;
  private localFallback: LocalStorageService;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    this.apiKey = process.env.CLOUDINARY_API_KEY || "";
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || "";
    this.folder = process.env.CLOUDINARY_FOLDER || "barcode-inventory";
    this.localFallback = new LocalStorageService();
  }

  isConfigured(): boolean {
    return !!(this.cloudName && this.apiKey && this.apiSecret);
  }

  async uploadFile(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    if (!this.isConfigured()) {
      return this.localFallback.uploadFile(fileBuffer, originalName, mimeType);
    }

    try {
      const timestamp = Math.round(Date.now() / 1000);
      const toSign = `folder=${this.folder}&timestamp=${timestamp}${this.apiSecret}`;
      const signature = crypto.createHash("sha1").update(toSign).digest("hex");

      const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

      const formData = new URLSearchParams();
      formData.append("file", base64Data);
      formData.append("api_key", this.apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", this.folder);

      const endpoint = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.secure_url) {
        console.warn("Cloudinary upload error, falling back to local storage:", data.error?.message);
        return this.localFallback.uploadFile(fileBuffer, originalName, mimeType);
      }

      return {
        fileUrl: data.secure_url,
        fileName: originalName,
        fileSize: data.bytes || fileBuffer.length,
        mimeType: data.format ? `image/${data.format}` : mimeType,
        provider: "cloudinary"
      };
    } catch (err: any) {
      console.warn("Cloudinary upload failed, falling back to local:", err.message);
      return this.localFallback.uploadFile(fileBuffer, originalName, mimeType);
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    return this.localFallback.deleteFile(fileUrl);
  }
}

export const storageService: IStorageService = new CloudinaryStorageService();
