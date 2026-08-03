import { Product } from "@/types";

export const products: Product[] = [
  {
    id: "1",
    name: "Kablosuz Kulaklık Pro",
    price: 2499,
    originalPrice: 3299,
    description:
      "Yüksek kaliteli ses, aktif gürültü engelleme ve 30 saat pil ömrü ile kablosuz kulaklık deneyimi. Su geçirmez tasarım ve konforlu kulaklık yastıkları.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Elektronik",
    rating: 4.8,
    reviews: 342,
    inStock: true,
  },
  {
    id: "2",
    name: "Akıllı Saat Ultra",
    price: 5499,
    originalPrice: 6999,
    description:
      "GPS takibi, kalp ritmi ölçer, uyku takibi ve su geçirmez akıllı saat. 7 gün pil ömrü ve 100+ spor modu.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Elektronik",
    rating: 4.6,
    reviews: 218,
    inStock: true,
  },
  {
    id: "3",
    name: "Laptop Standı Alüminyum",
    price: 899,
    originalPrice: 1299,
    description:
      "Ergonomik tasarım, yüksek kaliteli alüminyum malzeme. Her türlü laptop ile uyumlu, ayarlanabilir yükseklik ve hava kanallı soğutma.",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    category: "Aksesuar",
    rating: 4.5,
    reviews: 156,
    inStock: true,
  },
  {
    id: "4",
    name: "Mekanik Klavye RGB",
    price: 1899,
    originalPrice: 2399,
    description:
      "Blue switch mekanik tuşlar, per-key RGB aydınlatma, alüminyum gövde. Makro tuşları ve N-key rollover özelliği.",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop",
    category: "Elektronik",
    rating: 4.7,
    reviews: 489,
    inStock: true,
  },
  {
    id: "5",
    name: "Yoga Matı Premium",
    price: 599,
    originalPrice: 799,
    description:
      "6mm kalınlık, anti-slip yüzey, çevre dostu TPE malzeme. Kolay taşınabilir ve hijyenik, yoga ve pilates için ideal.",
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
    category: "Spor",
    rating: 4.4,
    reviews: 92,
    inStock: true,
  },
  {
    id: "6",
    name: "Akıllı Botlar Bluetooth",
    price: 1299,
    originalPrice: 1699,
    description:
      "Kablosuz bağlantı, gürültü engelleme mikrofonu, 24 saat pil ömrü. Kompakt taşıma kutusu ile birlikte.",
    image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&h=400&fit=crop",
    category: "Elektronik",
    rating: 4.3,
    reviews: 178,
    inStock: true,
  },
  {
    id: "7",
    name: "Sırt Çantası Modern",
    price: 749,
    originalPrice: 999,
    description:
      "27L kapasite, su geçirmez polyester, özel laptop bölmesi. Ergonomik omuz askıları ve gizemli cep.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    category: "Aksesuar",
    rating: 4.6,
    reviews: 234,
    inStock: true,
  },
  {
    id: "8",
    name: "Kahve Öğütücü El Tipi",
    price: 459,
    originalPrice: 599,
    description:
      "Konik öğütme taşı, ayarlanabilir öğütme derecesi, paslanmaz çelik gövde. Tutamaklı ve pratik tasarım.",
    image: "https://images.unsplash.com/photo-1610889556528-9a770b326f9b?w=400&h=400&fit=crop",
    category: "Ev & Yaşam",
    rating: 4.5,
    reviews: 67,
    inStock: false,
  },
];

export const categories = [
  "Tümü",
  "Elektronik",
  "Aksesuar",
  "Spor",
  "Ev & Yaşam",
];
