import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-white">Marketim</span>
            </Link>
            <p className="text-gray-400 max-w-md">
              Kaliteli ürünleri uygun fiyatlarla sunan online alışveriş deneyimi.
              Güvenli ödeme ve hızlı kargo ile kapınıza kadar.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Ürünler
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Sepetim
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">İletişim</h3>
            <ul className="space-y-2 text-gray-400">
              <li>info@marketim.com</li>
              <li>+90 212 555 0123</li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
          <p>&copy; 2026 Marketim. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
