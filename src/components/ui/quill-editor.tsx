"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Quill from "quill"
import "quill/dist/quill.snow.css"

interface QuillEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  onAutoSave?: (html: string) => Promise<void>
  autoSaveDelay?: number
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = "Décrivez votre produit en détail...",
  onAutoSave,
  autoSaveDelay = 2000,
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isReady, setIsReady] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const ignoreChangeRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return

    const toolbarOptions = [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      [{ size: ["small", false, "large", "huge"] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      ["link", "image", "video"],
      ["clean"],
    ]

    const quill = new Quill(containerRef.current, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: toolbarOptions,
      },
    })

    quill.on("text-change", (delta, oldDelta, source) => {
      if (ignoreChangeRef.current) return
      if (source !== "user") return

      const html = quill.root.innerHTML
      onChange(html)

      if (onAutoSave) {
        setSaveStatus("saving")
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
          try {
            await onAutoSave(html)
            setSaveStatus("saved")
            setTimeout(() => setSaveStatus("idle"), 3000)
          } catch {
            setSaveStatus("idle")
          }
        }, autoSaveDelay)
      }
    })

    quillRef.current = quill
    setIsReady(true)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      quillRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!quillRef.current || !isReady) return
    const currentHtml = quillRef.current.root.innerHTML
    if (value !== currentHtml) {
      ignoreChangeRef.current = true
      quillRef.current.root.innerHTML = value || ""
      ignoreChangeRef.current = false
    }
  }, [value, isReady])

  return (
    <div className="quill-editor-wrapper">
      <div ref={containerRef} className="quill-editor-container" />
      {onAutoSave && (
        <div className="mt-1.5 flex items-center gap-1.5 px-1">
          {saveStatus === "saving" && (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="text-xs text-amber-600">Enregistrement en cours...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600">Toutes les modifications sont enregistrées</span>
            </>
          )}
          {saveStatus === "idle" && (
            <span className="text-xs text-gray-400">Sauvegarde automatique activée</span>
          )}
        </div>
      )}
      <style jsx global>{`
        .quill-editor-wrapper .ql-toolbar {
          border-radius: 12px 12px 0 0;
          border-color: #d1d5db;
          background: #f9fafb;
        }
        .quill-editor-wrapper .ql-container {
          border-radius: 0 0 12px 12px;
          border-color: #d1d5db;
          font-size: 14px;
          min-height: 180px;
        }
        .quill-editor-wrapper .ql-editor {
          min-height: 180px;
          padding: 12px 16px;
        }
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .quill-editor-wrapper .ql-snow .ql-picker-label {
          border-color: #d1d5db;
        }
        .quill-editor-wrapper .ql-snow .ql-stroke {
          stroke: #6b7280;
        }
        .quill-editor-wrapper .ql-snow .ql-fill {
          fill: #6b7280;
        }
        .quill-editor-wrapper .ql-snow .ql-picker-options {
          border-color: #d1d5db;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .quill-editor-wrapper .ql-snow button:hover .ql-stroke {
          stroke: #7126b6;
        }
        .quill-editor-wrapper .ql-snow button.ql-active .ql-stroke {
          stroke: #7126b6;
        }
        .quill-editor-wrapper .ql-snow .ql-picker-label:hover {
          color: #7126b6;
        }
        .quill-editor-wrapper .ql-snow .ql-picker-label.ql-active {
          color: #7126b6;
        }
        .dark .quill-editor-wrapper .ql-toolbar {
          background: #1f2937;
          border-color: #374151;
        }
        .dark .quill-editor-wrapper .ql-container {
          background: #111827;
          border-color: #374151;
          color: #f3f4f6;
        }
        .dark .quill-editor-wrapper .ql-editor {
          color: #f3f4f6;
        }
        .dark .quill-editor-wrapper .ql-snow .ql-stroke {
          stroke: #9ca3af;
        }
        .dark .quill-editor-wrapper .ql-snow .ql-fill {
          fill: #9ca3af;
        }
        .dark .quill-editor-wrapper .ql-snow .ql-picker-label {
          color: #9ca3af;
          border-color: #374151;
        }
        .dark .quill-editor-wrapper .ql-snow .ql-picker-options {
          background: #1f2937;
          border-color: #374151;
        }
        .dark .quill-editor-wrapper .ql-snow button:hover .ql-stroke {
          stroke: #a78bfa;
        }
        .dark .quill-editor-wrapper .ql-snow button.ql-active .ql-stroke {
          stroke: #a78bfa;
        }
        .dark .quill-editor-wrapper .ql-snow .ql-picker-label:hover {
          color: #a78bfa;
        }
        .dark .quill-editor-wrapper .ql-snow .ql-picker-label.ql-active {
          color: #a78bfa;
        }
      `}</style>
    </div>
  )
}
