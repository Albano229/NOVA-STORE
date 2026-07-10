import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { withRateLimit } from "@/lib/api-rate-limit";
import {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_DOC_MIMES,
  ALLOWED_DIGITAL_MIMES,
  ALLOWED_MIMES,
  DIGITAL_MIME_SET,
  MIME_MAP,
  MAX_FILE_SIZE_BYTES,
  MAX_SINGLE_UPLOAD_BYTES,
} from "@/lib/upload-constants";

const ALLOWED_TYPES: string[] = [...ALLOWED_MIMES];
const MAX_CHUNK_SIZE = MAX_FILE_SIZE_BYTES;
const MAX_SINGLE_UPLOAD = MAX_SINGLE_UPLOAD_BYTES;

const PUBLIC_BUCKET = "nova-uploads";
const PRIVATE_BUCKET = "nova-files";

const DIGITAL_TYPES = DIGITAL_MIME_SET;

async function ensureBucket(name: string, isPublic: boolean, mimeTypes: string[]) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === name);
  if (!exists) {
    await supabase.storage.createBucket(name, {
      public: isPublic,
      fileSizeLimit: MAX_CHUNK_SIZE,
      allowedMimeTypes: mimeTypes,
    });
  } else {
    await supabase.storage.updateBucket(name, {
      public: isPublic,
      fileSizeLimit: MAX_CHUNK_SIZE,
      allowedMimeTypes: mimeTypes,
    });
  }
}

export const POST = withRateLimit(
  async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé. Connectez-vous pour uploader." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";
    const isPrivate = formData.get("private") === "true";
    const chunkIndex = formData.get("chunkIndex") as string | null;
    const totalChunks = formData.get("totalChunks") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const fileType = formData.get("fileType") as string | null;
    const fileSizeStr = formData.get("fileSize") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier sélectionné." }, { status: 400 });
    }

    const resolvedType = file.type || fileType || "";
    const resolvedName = file.name || fileName || "unknown";
    const totalSize = fileSizeStr ? parseInt(fileSizeStr) : file.size;

    const ext = resolvedName.split(".").pop()?.toLowerCase() || "";
    const mimeType = resolvedType || MIME_MAP[ext] || "application/octet-stream";

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Type "${mimeType}" non autorisé. Autorisés: PDF, APK, ZIP, RAR, MP4.` },
        { status: 400 }
      );
    }

    const isChunked = chunkIndex !== null && totalChunks !== null;
    const usePrivateBucket = isPrivate || DIGITAL_TYPES.has(mimeType);
    const bucketName = usePrivateBucket ? PRIVATE_BUCKET : PUBLIC_BUCKET;

    const PRIVATE_ALLOWED_TYPES = [...ALLOWED_DOC_MIMES, ...ALLOWED_DIGITAL_MIMES];
    await ensureBucket(
      bucketName,
      !usePrivateBucket,
      usePrivateBucket ? PRIVATE_ALLOWED_TYPES : ALLOWED_TYPES
    );

    const safeName = resolvedName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const timestamp = Date.now();

    if (isChunked) {
      const ci = parseInt(chunkIndex);
      const tc = parseInt(totalChunks);
      const filePath = `${folder}/${session.user.id}/${timestamp}_${safeName}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (ci === 0) {
        const { error: delError } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);
        if (delError && !delError.message?.includes("not found")) {
          console.error("Cleanup error:", delError);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
          metadata: {
            contentType: mimeType,
            size: totalSize.toString(),
          },
        });

      if (uploadError) {
        console.error("Chunk upload error:", uploadError);
        return NextResponse.json({ error: `Erreur chunk: ${uploadError.message}` }, { status: 500 });
      }

      if (ci === tc - 1) {
        if (usePrivateBucket) {
          const { data: signedData, error: signError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 3600);

          if (signError) {
            console.error("Signed URL error:", signError);
          }

          return NextResponse.json({
            url: signedData?.signedUrl || "",
            path: filePath,
            bucket: bucketName,
            isPrivate: true,
            name: resolvedName,
            size: totalSize,
            type: mimeType,
          });
        }

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        return NextResponse.json({
          url: urlData.publicUrl,
          path: filePath,
          bucket: bucketName,
          isPrivate: false,
          name: resolvedName,
          size: totalSize,
          type: mimeType,
        });
      }

      return NextResponse.json({
        chunk: ci,
        totalChunks: tc,
        received: true,
      });
    }

    if (file.size > MAX_SINGLE_UPLOAD) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Utilisez l'upload chunked (> 50 Mo).` },
        { status: 400 }
      );
    }

    const filePath = `${folder}/${session.user.id}/${timestamp}_${safeName}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      let errorMsg = "Échec de l'upload.";
      if (uploadError.message?.includes("duplicate")) {
        errorMsg = "Un fichier avec ce nom existe déjà.";
      } else if (uploadError.message?.includes("size")) {
        errorMsg = "Fichier trop volumineux.";
      } else {
        errorMsg = `Erreur upload: ${uploadError.message || "inconnue"}`;
      }
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const finalPath = data?.path || filePath;

    if (usePrivateBucket) {
      const { data: signedData, error: signError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(finalPath, 3600);

      if (signError) {
        console.error("Signed URL error:", signError);
      }

      return NextResponse.json({
        url: signedData?.signedUrl || "",
        path: finalPath,
        bucket: bucketName,
        isPrivate: true,
        name: resolvedName,
        size: file.size,
        type: mimeType,
      });
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(finalPath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: finalPath,
      bucket: bucketName,
      isPrivate: false,
      name: resolvedName,
      size: file.size,
      type: mimeType,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error?.message || "inconnue"}` },
      { status: 500 }
    );
  }
},
  { limit: 15, window: 60_000, keyPrefix: "upload" }
);
