"use client";

import { useCartStore } from "@/stores/cart";
import { useCurrency } from "@/contexts/currency-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2, ShoppingBag, Minus, Plus, ArrowLeft, Globe } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getVendorGroups } = useCartStore();
  const { currency, convertPrice, formatConvertedPrice } = useCurrency();
  const vendorGroups = getVendorGroups();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold text-[#0f172a]">Votre panier est vide</h1>
        <p className="mt-2 text-gray-500">Découvrez nos produits et ajoutez-en à votre panier.</p>
        <Link href="/products">
          <Button className="mt-6" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continuer mes achats
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0f172a]">Mon panier</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Globe className="h-4 w-4" />
          Devise: <span className="font-medium text-[#0f172a] dark:text-white">{currency.code} ({currency.symbol})</span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(vendorGroups).map(([shopId, shopItems]) => (
            <div key={shopId} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-sm font-semibold text-[#0f172a] dark:text-white">
                Vendeur : {shopItems[0].shopName}
              </h3>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {shopItems.map((item) => (
                  <div key={item.productId} className="flex gap-4 py-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">📦</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/product/${item.productId}`} className="text-sm font-medium text-[#0f172a] hover:text-[#7126b6] dark:text-white break-words">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatConvertedPrice(item.price, item.currency !== currency.code ? item.currency : undefined)}
                        {item.currency !== currency.code && (
                          <span className="ml-1 text-xs text-gray-400">
                            (original: {item.price.toLocaleString()} {item.currency})
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                            className="px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[32px] text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            className="px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#0f172a] dark:text-white">
                        {formatConvertedPrice(item.price * item.quantity, item.currency !== currency.code ? item.currency : undefined)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 h-fit dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-[#0f172a] dark:text-white">Résumé</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total ({items.length} article{items.length > 1 ? "s" : ""})</span>
              <span className="font-medium dark:text-white">{formatConvertedPrice(getTotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Livraison</span>
              <span className="text-green-600 font-medium">Gratuite</span>
            </div>
            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-[#0f172a] dark:text-white">Total</span>
                <span className="text-lg font-bold text-[#0f172a] dark:text-white">{formatConvertedPrice(getTotal())}</span>
              </div>
            </div>
          </div>
          <Link href="/checkout">
            <Button className="mt-6 w-full" size="lg">
              Passer la commande
            </Button>
          </Link>
          <Link href="/products" className="mt-3 block text-center text-sm text-[#7126b6] hover:underline">
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
