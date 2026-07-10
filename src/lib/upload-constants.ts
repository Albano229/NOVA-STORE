export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

export const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ALLOWED_DIGITAL_MIMES = [
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "application/vnd.android.package-archive",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
];

export const ALLOWED_MIMES = [
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_DOC_MIMES,
  ...ALLOWED_DIGITAL_MIMES,
];

export const DIGITAL_FILE_EXTENSIONS = ".pdf,.apk,.zip,.rar,.mp4,.epub,.doc,.docx";

export const DIGITAL_MIME_SET = new Set<string>([
  ...ALLOWED_DOC_MIMES,
  ...ALLOWED_DIGITAL_MIMES,
]);

export const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  apk: "application/vnd.android.package-archive",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  mp4: "video/mp4",
  epub: "application/epub+zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
export const MAX_SINGLE_UPLOAD_BYTES = 50 * 1024 * 1024;
export const CHUNK_SIZE_BYTES = 5 * 1024 * 1024;
