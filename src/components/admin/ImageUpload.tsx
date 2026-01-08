import { useState, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface ImageItem {
  url: string;
  publicId: string;
}

interface ImageUploadProps {
  value: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxFiles?: number;
  className?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  maxFiles = 5,
  className,
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      if (value.length + files.length > maxFiles) {
        toast({
          title: 'Слишком много файлов',
          description: `Максимум ${maxFiles} изображений`,
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);

      try {
        const fileArray = Array.from(files);
        const { images } = await uploadApi.multiple(fileArray);

        onChange([...value, ...images]);

        toast({
          title: 'Готово',
          description: `Загружено изображений: ${images.length}`,
        });
      } catch (err) {
        toast({
          title: 'Ошибка загрузки',
          description: 'Не удалось загрузить изображения',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange, maxFiles, toast]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  const removeImage = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          disabled={isUploading || value.length >= maxFiles}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}

          <p className="text-sm">
            <span className="font-semibold text-primary">
              Нажмите для загрузки
            </span>{' '}
            или перетащите файлы
          </p>

          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP до 10MB ({value.length}/{maxFiles})
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((img, index) => (
            <div
              key={img.publicId}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={img.url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>

              {index === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                  Главное
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
