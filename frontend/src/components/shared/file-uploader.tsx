import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  label: string
  file: File | null
  onFileSelect: (file: File | null) => void
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
}

const defaultAccept = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

export function FileUploader({
  label,
  file,
  onFileSelect,
  accept = defaultAccept,
  maxSize = 10 * 1024 * 1024,
  className,
}: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  })

  if (file) {
    return (
      <div className={cn('flex items-center gap-3 rounded-lg border p-3', className)}>
        <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onFileSelect(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        className,
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        Drag & drop or click to browse. PDF, JPG, PNG up to{' '}
        {Math.round(maxSize / (1024 * 1024))}MB.
      </p>
    </div>
  )
}
