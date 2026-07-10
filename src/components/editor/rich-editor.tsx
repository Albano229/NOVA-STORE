"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import Highlight from "@tiptap/extension-highlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Code2,
  Quote,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
} from "lucide-react"
import { useCallback, useState, useRef } from "react"

const lowlight = createLowlight(common)

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Commencez à écrire votre description...",
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextStyle,
      Color,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  })

  const setHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor?.chain().focus().toggleHeading({ level }).run()
      setShowHeadingDropdown(false)
    },
    [editor]
  )

  const addImage = useCallback(() => {
    const url = window.prompt("URL de l'image:")
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt("URL du lien:")
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    const rows = window.prompt("Nombre de lignes:", "3")
    const cols = window.prompt("Nombre de colonnes:", "3")
    if (rows && cols) {
      editor
        ?.chain()
        .focus()
        .insertTable({ rows: parseInt(rows), cols: parseInt(cols), withHeaderRow: true })
        .run()
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 h-12 animate-pulse" />
        <div className="h-[400px] bg-gray-50 animate-pulse" />
      </div>
    )
  }

  const ToolButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  )

  const Separator = () => <div className="w-px h-6 bg-gray-200 mx-1" />

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        <div className="flex items-center gap-0.5" ref={dropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Heading1 size={16} />
              <ChevronDown size={12} />
            </button>
            {showHeadingDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setHeading(level as 1 | 2 | 3 | 4 | 5 | 6)}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors ${
                      editor.isActive("heading", { level }) ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  >
                    Titre {level}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Gras"
        >
          <Bold size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italique"
        >
          <Italic size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Souligné"
        >
          <UnderlineIcon size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Barré"
        >
          <Strikethrough size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Code inline"
        >
          <Code size={16} />
        </ToolButton>

        <Separator />

        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Aligner à gauche"
        >
          <AlignLeft size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Centrer"
        >
          <AlignCenter size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Aligner à droite"
        >
          <AlignRight size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          title="Justifier"
        >
          <AlignJustify size={16} />
        </ToolButton>

        <Separator />

        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Liste à puces"
        >
          <List size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Liste numérotée"
        >
          <ListOrdered size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive("taskList")}
          title="Liste de tâches"
        >
          <ListChecks size={16} />
        </ToolButton>

        <Separator />

        <ToolButton onClick={addImage} title="Insérer une image">
          <ImageIcon size={16} />
        </ToolButton>
        <ToolButton onClick={addLink} isActive={editor.isActive("link")} title="Insérer un lien">
          <LinkIcon size={16} />
        </ToolButton>
        <ToolButton onClick={addTable} title="Insérer un tableau">
          <TableIcon size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Bloc de code"
        >
          <Code2 size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Citation"
        >
          <Quote size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Ligne horizontale"
        >
          <Minus size={16} />
        </ToolButton>

        <Separator />

        <ToolButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annuler"
        >
          <Undo2 size={16} />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refaire"
        >
          <Redo2 size={16} />
        </ToolButton>
      </div>

      <EditorContent
        editor={editor}
        className="tiptap-editor min-h-[400px] max-h-[600px] overflow-y-auto"
      />

      <style jsx global>{`
        .tiptap-editor .tiptap {
          min-height: 400px;
          outline: none;
        }
        .tiptap-editor .tiptap p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap-editor .tiptap h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          margin-top: 1rem;
        }
        .tiptap-editor .tiptap h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.75rem;
        }
        .tiptap-editor .tiptap h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.75rem;
        }
        .tiptap-editor .tiptap h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .tiptap-editor .tiptap h5 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .tiptap-editor .tiptap h6 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }
        .tiptap-editor .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .tiptap-editor .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .tiptap-editor .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .tiptap-editor .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin: 0.25rem 0;
        }
        .tiptap-editor .tiptap ul[data-type="taskList"] li label {
          margin-top: 0.15rem;
        }
        .tiptap-editor .tiptap ul[data-type="taskList"] li input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          accent-color: #3b82f6;
        }
        .tiptap-editor .tiptap blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
        }
        .tiptap-editor .tiptap pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .tiptap-editor .tiptap pre code {
          background: none;
          padding: 0;
          color: inherit;
          font-size: 0.875rem;
        }
        .tiptap-editor .tiptap code {
          background: #f1f5f9;
          color: #e11d48;
          padding: 0.15rem 0.35rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .tiptap-editor .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .tiptap-editor .tiptap a {
          color: #3b82f6;
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap-editor .tiptap mark {
          background-color: #fef08a;
          padding: 0.1rem 0.2rem;
          border-radius: 0.15rem;
        }
        .tiptap-editor .tiptap hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5rem 0;
        }
        .tiptap-editor .tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .tiptap-editor .tiptap table td,
        .tiptap-editor .tiptap table th {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }
        .tiptap-editor .tiptap table th {
          background: #f8fafc;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
