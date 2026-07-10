"use client"
import { useState, useEffect, useCallback } from "react"

interface RecentProduct {
  id: string
  name: string
  slug: string
  price: number
  image: string
  shopName: string
  viewedAt: number
}

const STORAGE_KEY = "nova-recently-viewed"
const MAX_ITEMS = 20

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProduct[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecentlyViewed(JSON.parse(stored))
    } catch {}
  }, [])

  const addProduct = useCallback((product: Omit<RecentProduct, "viewedAt">) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id)
      const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearRecent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRecentlyViewed([])
  }, [])

  return { recentlyViewed, addProduct, clearRecent }
}
