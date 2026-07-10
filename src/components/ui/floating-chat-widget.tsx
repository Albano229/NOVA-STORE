"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Sparkles, Send, X, MessageCircle, ExternalLink, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  products?: Array<{ id: string; name: string; price: number; slug: string; image: string }>
  suggestions?: string[]
  timestamp: Date
}

const QUICK_SUGGESTIONS = [
  "Comment vendre sur NOVA Store ?",
  "Découvrir les promos",
  "Suivre mon colis",
  "Contact support",
]

export default function FloatingChatWidget() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = session?.user?.name
        ? `Bonjour ${session.user.name} ! 👋 Je suis Nova, votre assistant. Comment puis-je vous aider ?`
        : "Bonjour ! 👋 Je suis Nova, votre assistant NOVA Store. Comment puis-je vous aider ?"
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: greeting,
        suggestions: QUICK_SUGGESTIONS,
        timestamp: new Date(),
      }])
    }
  }, [isOpen, session])

  if (pathname === "/") return null

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        products: data.products,
        suggestions: data.suggestions,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Désolé, une erreur est survenue. Réessayez dans un instant.",
        timestamp: new Date(),
      }])
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-[85] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 ${
          isOpen
            ? "bg-gray-800 dark:bg-zinc-700 rotate-0"
            : "bg-gradient-to-r from-[#7126b6] to-purple-500 hover:scale-110 animate-bounce"
        }`}
      >
        {isOpen ? (
          <X className="h-5 w-5 text-white sm:h-6 sm:w-6" />
        ) : (
          <MessageCircle className="h-5 w-5 text-white sm:h-6 sm:w-6" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-34 right-4 z-[84] flex w-[calc(100vw-2rem)] max-w-[380px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 sm:bottom-24 sm:right-6"
          style={{ height: "min(460px, calc(100vh - 160px))" }}
        >
          <div className="bg-gradient-to-r from-[#7126b6] to-purple-500 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Nova Assistant</h3>
                <p className="text-xs text-white/80">En ligne — Répond en quelques secondes</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-[#7126b6] text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md dark:bg-zinc-800 dark:text-zinc-200"
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md transition dark:bg-zinc-700 dark:border-zinc-600"
                          onClick={() => setIsOpen(false)}
                        >
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-600">
                              <ShoppingCart className="h-5 w-5 text-gray-400 dark:text-zinc-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0f172a] truncate dark:text-zinc-50">{product.name}</p>
                            <p className="text-xs font-semibold text-[#7126b6]">{product.price.toLocaleString()} FCFA</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 dark:text-zinc-500" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(s)}
                          className="rounded-full bg-white/90 border border-gray-200 px-3 py-1 text-xs text-[#7126b6] hover:bg-[#7126b6] hover:text-white transition dark:bg-zinc-700/90 dark:border-zinc-600 dark:text-purple-400 dark:hover:bg-purple-600"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 dark:bg-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Tapez votre message..."
                className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7126b6] text-white transition hover:bg-[#5e1f9a] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
