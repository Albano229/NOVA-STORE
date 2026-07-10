"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  folder?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
  previewClassName?: string;
}

export function ImageUploader({
  value,
  onChange,
  label,
  folder = "settings",
  className = "",
  accept = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/x-icon",
  maxSizeMB = 5,
  previewClassName = "",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux (max ${maxSizeMB}MB)`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.url) {
        onChange(data.url);
        toast.success("Image uploadée");
      } else {
        toast.error(data.error || "Erreur lors de l'upload");
      }
    } catch {
      toast.error("Erreur réseau lors de l'upload");
    }
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</label>

      {value ? (
        <div className={`relative inline-block ${previewClassName}`}>
          <img
            src={value}
            alt={label}
            className="h-20 w-auto max-w-[180px] rounded-lg border border-gray-200 object-contain p-1 dark:border-zinc-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-image.png";
            }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/20"
              : "border-gray-300 hover:border-[#7126b6] hover:bg-gray-50 dark:border-zinc-700 dark:hover:border-purple-500 dark:hover:bg-zinc-800"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#7126b6]" />
          ) : (
            <>
              <div className="rounded-xl bg-gray-100 p-3 dark:bg-zinc-800">
                <ImageIcon className="h-6 w-6 text-gray-400 dark:text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Cliquez ou glissez une image
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                  PNG, JPG, WebP, SVG, GIF (max {maxSizeMB}MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
