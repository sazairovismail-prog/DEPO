"use client";

import Link from "next/link";
import CartItem from "@/components/CartItem";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, cartTotal, clearCart } = useCart();

  const shippingCost = cartTotal > 5000 ? 0 : 199;
  const grandTotal = cartTotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sepetiniz Boş
          </h1>
          <p className="text-gray-600 mb-8">
            Henüz sepetinize ürün eklemediniz. Ürünleri keşfedin ve alışverişe başlayın.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Ürünleri Keşfet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Sepetim</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
          >
            Sepeti Temizle
          </button>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sipariş Özeti
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Ara Toplam</span>
                <span>{cartTotal.toLocaleString("tr-TR")} TL</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Kargo</span>
                <span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Ücretsiz</span>
                  ) : (
                    `${shippingCost.toLocaleString("tr-TR")} TL`
                  )}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-sm text-gray-500">
                  5000 TL üzeri siparişlerde kargo bedava!
                </p>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Toplam</span>
                <span>{grandTotal.toLocaleString("tr-TR")} TL</span>
              </div>
            </div>

            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors">
              Siparişi Tamamla
            </button>

            <Link
              href="/products"
              className="block text-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
