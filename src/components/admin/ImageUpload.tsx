import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
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
          title: 'Too many files',
          description: `Maximum ${maxFiles} images allowed`,
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);
      try {
        const fileArray = Array.from(files);
        const { urls } = await uploadApi.multiple(fileArray);
        onChange([...value, ...urls]);
        toast({
          title: 'Upload successful',
          description: `${urls.length} image(s) uploaded`,
        });
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: 'Failed to upload images. Please try again.',
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
    } else if (e.type === 'dragleave') {
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
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
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
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading || value.length >= maxFiles}
        />
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <Upload className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="text-sm">
            <span className="font-semibold text-primary">Click to upload</span>
            <span className="text-muted-foreground"> or drag and drop</span>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP up to 10MB ({value.length}/{maxFiles})
          </p>
        </div>
      </div>

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
