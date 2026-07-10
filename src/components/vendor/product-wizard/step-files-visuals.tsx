"use client"

import { WizardData } from "@/types/product"
import { Upload, File, ExternalLink, X, CheckCircle } from "lucide-react"
import { useState, useRef, useCallback } from "react"
import { DIGITAL_FILE_EXTENSIONS, MAX_FILE_SIZE_BYTES, CHUNK_SIZE_BYTES } from "@/lib/upload-constants"

interface StepFilesVisualsProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}

const DIGITAL_EXTENSIONS = DIGITAL_FILE_EXTENSIONS
const MAX_FILE_SIZE = MAX_FILE_SIZE_BYTES
const CHUNK_SIZE = CHUNK_SIZE_BYTES

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} Go`
}

export default function StepFilesVisuals({ data, onChange }: StepFilesVisualsProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const uploadChunked = useCallback(async (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let uploadedBytes = 0

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append("file", chunk, file.name)
      formData.append("fileName", file.name)
      formData.append("fileType", file.type)
      formData.append("fileSize", file.size.toString())
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())
      formData.append("private", "true")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: abortRef.current?.signal,
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Erreur lors de l'upload")
      }

      uploadedBytes += end - start
      setProgress(Math.round((uploadedBytes / file.size) * 100))

      if (chunkIndex === totalChunks - 1) {
        const json = await res.json()
        return json
      }
    }
  }, [])

  const uploadSimple = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("private", "true")

    const xhr = new XMLHttpRequest()

    const promise = new Promise<any>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener("load", () => {
        try {
          const json = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json)
          } else {
            reject(new Error(json.error || "Erreur lors de l'upload"))
          }
        } catch {
          reject(new Error("Erreur lors de la lecture de la réponse"))
        }
      })

      xhr.addEventListener("error", () => reject(new Error("Erreur réseau")))
      xhr.addEventListener("abort", () => reject(new Error("Upload annulé")))

      abortRef.current = new AbortController()
      abortRef.current.signal.addEventListener("abort", () => xhr.abort())

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    })

    return promise
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux (${formatSize(file.size)}). Maximum : 500 Mo.`)
      return
    }

    setError("")
    setUploading(true)
    setProgress(0)

    try {
      let json: any

      if (file.size > 50 * 1024 * 1024) {
        json = await uploadChunked(file)
      } else {
        json = await uploadSimple(file)
      }

      if (json.url) {
        onChange({
          fileUrl: json.url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          storagePath: json.path || "",
          storageBucket: json.bucket || "nova-files",
        })
      }
    } catch (err: any) {
      if (err.message !== "Upload annulé") {
        setError(err.message || "Erreur lors de l'upload")
      }
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [onChange, uploadChunked, uploadSimple])

  const handleCancel = () => {
    abortRef.current?.abort()
    setUploading(false)
    setProgress(0)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Fichiers & Visuels</h2>
        <p className="mt-1 text-sm text-gray-500">
          Téléversez le fichier source et configurez l&apos;accès
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#0f172a]">
          Fichier source numérique
        </label>

        {data.fileUrl ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{data.fileName || "Fichier téléversé"}</p>
              <p className="text-xs text-green-600">
                {data.fileType} — {formatSize(data.fileSize)}
              </p>
            </div>
            <button
              onClick={() => onChange({ fileUrl: "", fileName: "", fileSize: 0, fileType: "", storagePath: "", storageBucket: "" })}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : uploading ? (
          <div className="rounded-xl border border-[#7126b6]/30 bg-purple-50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#7126b6] animate-pulse" />
                <span className="text-sm font-medium text-[#7126b6]">Upload en cours...</span>
              </div>
              <button
                onClick={handleCancel}
                className="text-sm text-red-500 hover:underline"
              >
                Annuler
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7126b6] to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-right text-sm font-semibold text-[#7126b6]">{progress}%</p>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
              dragOver
                ? "border-[#7126b6] bg-purple-50 scale-[1.02]"
                : "border-gray-300 bg-gray-50 hover:border-[#7126b6] hover:bg-purple-50"
            }`}
          >
            <Upload className="mb-3 h-10 w-10 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Cliquez ou glissez le fichier ici
            </span>
            <span className="mt-2 text-xs text-gray-400 text-center">
              PDF, APK, ZIP, RAR, MP4 — Max 500 Mo
            </span>
            <span className="mt-1 text-[10px] text-gray-400">
              Upload chunked pour les gros fichiers
            </span>
            <input
              ref={inputRef}
              type="file"
              accept={DIGITAL_EXTENSIONS}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
                if (inputRef.current) inputRef.current.value = ""
              }}
            />
          </label>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#0f172a]">
          <ExternalLink className="mr-1 inline h-4 w-4" />
          Lien externe optionnel
        </label>
        <p className="text-xs text-gray-400">URL alternative de téléchargement ou de consultation</p>
        <input
          type="url"
          value={data.externalUrl}
          onChange={(e) => onChange({ externalUrl: e.target.value })}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Max téléchargements par client</label>
          <input
            type="number"
            value={data.maxDownloads || ""}
            onChange={(e) => onChange({ maxDownloads: Number(e.target.value) })}
            placeholder="0 = illimité"
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Version</label>
          <input
            type="text"
            value={data.version}
            onChange={(e) => onChange({ version: e.target.value })}
            placeholder="Ex: 1.0"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
      </div>
    </div>
  )
}
