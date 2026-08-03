"use client";

import { CartItem as CartItemType } from "@/types";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
      <img
        src={item.image}
        alt={item.name}
        className="w-20 h-20 object-cover rounded-lg"
      />

      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.id}`}
          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
        >
          {item.name}
        </Link>
        <p className="text-sm text-gray-500 mt-1">{item.category}</p>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            -
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="text-lg font-bold text-gray-900">
          {(item.price * item.quantity).toLocaleString("tr-TR")} TL
        </p>
        {item.quantity > 1 && (
          <p className="text-sm text-gray-500">
            {item.price.toLocaleString("tr-TR")} TL / adet
          </p>
        )}
        <button
          onClick={() => removeFromCart(item.id)}
          className="mt-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
        >
          Kaldır
        </button>
      </div>
    </div>
  );
}
