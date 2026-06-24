'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductAvatar } from '@/components/data-display/product-avatar';
import { cn } from '@/lib/utils';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface CloudinarySignatureResponse {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  eager: string;
  error?: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  eager?: Array<{
    secure_url?: string;
    width?: number;
    height?: number;
  }>;
}

interface ProductPhotoFieldProps {
  value: string;
  productName: string;
  disabled?: boolean;
  onChange: (url: string) => void;
}

async function uploadProductImage(file: File) {
  const signatureResponse = await fetch('/api/cloudinary/signature', { method: 'POST' });
  const signature = (await signatureResponse.json()) as CloudinarySignatureResponse;

  if (!signatureResponse.ok || signature.error) {
    throw new Error(signature.error || 'Không thể chuẩn bị tải ảnh.');
  }

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signature.apiKey);
  body.append('timestamp', String(signature.timestamp));
  body.append('signature', signature.signature);
  body.append('folder', signature.folder);
  body.append('eager', signature.eager);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: 'POST', body }
  );
  const upload = (await uploadResponse.json()) as CloudinaryUploadResponse & { error?: { message?: string } };

  if (!uploadResponse.ok || upload.error) {
    throw new Error(upload.error?.message || 'Tải ảnh lên Cloudinary thất bại.');
  }

  return {
    secureUrl: upload.eager?.[0]?.secure_url ?? upload.secure_url,
    publicId: upload.public_id,
    width: upload.eager?.[0]?.width ?? upload.width,
    height: upload.eager?.[0]?.height ?? upload.height,
  };
}

export function ProductPhotoField({
  value,
  productName,
  disabled,
  onChange,
}: ProductPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Chỉ chọn file ảnh.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('Ảnh tối đa 5 MB. Hãy chọn ảnh nhẹ hơn.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadProductImage(file);
      onChange(result.secureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ảnh.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card p-3',
        error && 'border-destructive/60'
      )}>
        <ProductAvatar name={productName || 'Sản phẩm'} imageUrl={value || null} size="xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium">Ảnh đại diện sản phẩm</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Chụp hoặc tải ảnh để dễ nhận diện sản phẩm khi nhập/xuất kho.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : value ? <Upload className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              {isUploading ? 'Đang tải ảnh' : value ? 'Đổi ảnh' : 'Chụp/tải ảnh'}
            </Button>
            {value && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onChange('')}
                disabled={disabled || isUploading}
              >
                <Trash2 className="h-4 w-4" />
                Bỏ ảnh
              </Button>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept="image/*"
        capture="environment"
        disabled={disabled || isUploading}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
