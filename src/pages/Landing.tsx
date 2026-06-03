import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Store, 
  ChevronRight, 
  BarChart3, 
  Smartphone, 
  ShieldCheck, 
  Zap,
  Coffee,
  ShoppingBag,
  ArrowRight,
  Star,
  Package,
  Search,
  Filter,
  X,
  MessageCircle,
  Menu,
  Heart,
  Phone,
  MapPin
} from "lucide-react";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLandingCMS } from "@/hooks/useLandingCMS";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, Minus, ShoppingCart as CartIcon, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Landing() {
  const navigate = useNavigate();
  const { data: config } = useStoreConfig();
  const { user } = useAuth();
  const { items, total, itemCount, addItem, removeItem, updateQuantity } = useCart();
  const { data: cms, isLoading: isLoadingCMS } = useLandingCMS();

  useEffect(() => {
    if (cms) console.log("Landing CMS Data Loaded:", cms);
  }, [cms]);
  
  // Log visit
  useEffect(() => {
    const logVisit = async () => {
      try {
        let vid = localStorage.getItem('sweet_bakery_vid');
        if (!vid) {
          vid = Math.random().toString(36).substring(7) + Date.now().toString(36);
          localStorage.setItem('sweet_bakery_vid', vid);
        }
        
        // Simple visit log
        await supabase.from('web_visits').insert({ 
          visitor_hash: vid,
          user_agent: navigator.userAgent
        });
      } catch (e) {
        console.error("Visit log failed", e);
      }
    };
    logVisit();
  }, []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const storeName = config?.store_name || "WUDkopi";

  // Fetch All Products
  const { data: allProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['store_products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['store_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchQuery, selectedCategory]);

  const handleAddToCart = (product: any) => {
    addItem({
      ...product,
      stock: 99,
      category_id: product.category_id || null,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || new Date().toISOString()
    });
    toast.success(`${product.name} ditambahkan ke keranjang`, {
      position: "top-center",
      className: "gradient-primary text-white border-none",
    });
    
    // Auto-open cart
    setIsCartOpen(true);
  };

  const handleWhatsAppCheckout = () => {
    const phone = config?.store_phone || "628123456789";
    const itemDetails = items.map(item => `- ${item.product.name} (x${item.quantity}): Rp ${(item.product.price * item.quantity).toLocaleString()}`).join('\n');
    const message = `Halo ${storeName}, saya ingin memesan:\n\n${itemDetails}\n\n*Total: Rp ${total.toLocaleString()}*\n\nMohon informasi selanjutnya. Terima kasih!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Helper for dynamic icons
  const IconComponent = ({ name, className }: { name: string, className?: string }) => {
    const Icon = (LucideIcons as any)[name] || Star;
    return <Icon className={className} />;
  };

  // Force bakery theme as primary for now per user request
  const activeTemplate = cms?.settings?.active_template || 'bakery';

  // Theme Config
  const themes: Record<string, any> = {
    bakery: {
      bg: "bg-[#f0f9f1]", // Pastel Green
      text: "text-[#5d4037]",
      accent: "text-[#ec4899]", // Pink
      card: "bg-white border-pink-100 shadow-md shadow-pink-100/20 text-[#5d4037]",
      nav: "bg-white/80 backdrop-blur-xl border-b border-[#ec4899]/10",
      heroBg: "bg-[radial-gradient(circle_at_50%_-20%,rgba(236,72,153,0.1),#f0f9f1)]",
      button: "bg-[#ec4899] hover:bg-[#db2777] text-white shadow-pink-200 shadow-lg",
      badge: "bg-[#ec4899]/10 text-[#ec4899]"
    },
    default: {
      bg: "bg-background",
      text: "text-foreground",
      accent: "text-primary",
      card: "bg-card border-border",
      nav: "glass-morphism",
      heroBg: "bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--primary),0.15),transparent)]",
      button: "gradient-primary",
      badge: "bg-primary/10 text-primary"
    },
    wood: {
      bg: "bg-[#3d2b1f]",
      text: "text-[#fdfcf0]",
      accent: "text-[#e6ccb2]",
      card: "bg-[#4a3526] border-[#5d4037]",
      nav: "bg-[#3d2b1f]/90 backdrop-blur-md",
      heroBg: "bg-transparent",
      button: "bg-[#8b4513] hover:bg-[#6f370f] text-white",
      badge: "bg-[#e6ccb2]/20 text-[#e6ccb2]"
    },
    minimal: {
      bg: "bg-white",
      text: "text-slate-900",
      accent: "text-blue-600",
      card: "bg-slate-50 border-slate-200 shadow-none",
      nav: "bg-white/90 backdrop-blur-sm border-b border-slate-100",
      heroBg: "bg-transparent",
      button: "bg-slate-900 hover:bg-slate-800 text-white",
      badge: "bg-slate-100 text-slate-600"
    }
  };

  const theme = themes[activeTemplate] || themes.bakery;

  const hero = cms?.hero || {
    title: "cake n bake fresh from oven",
    subtitle: "Temukan berbagai pilihan menu premium yang dibuat dengan penuh kasih sayang untuk setiap momen berharga Anda.",
    image_url: "/wudkopi-logo.png",
    cta_text: "Belanja Sekarang",
    secondary_cta_text: "Tentang Kami"
  };

  const features = cms?.features || [];

  const [currentSlide, setCurrentSlide] = useState(0);
  const heroImages = useMemo(() => {
    // If a specific category is selected, show products from that category in the hero
    if (selectedCategory !== 'all') {
      const categoryProducts = allProducts.filter(p => p.category_id === selectedCategory);
      if (categoryProducts.length > 0) {
        return categoryProducts.map(p => p.image_url || "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1600");
      }
    }
    // Default to CMS hero images
    if (hero.images && hero.images.length > 0) return hero.images;
    return [hero.image_url || "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1600"];
  }, [hero.images, hero.image_url, selectedCategory, allProducts]);

  const activeHeroProduct = useMemo(() => {
    if (selectedCategory !== 'all') {
      const categoryProducts = allProducts.filter(p => p.category_id === selectedCategory);
      return categoryProducts[currentSlide % categoryProducts.length];
    }
    return null;
  }, [selectedCategory, allProducts, currentSlide]);

  useEffect(() => {
    setCurrentSlide(0); // Reset slide when category changes
  }, [selectedCategory]);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  return (
    <div className={`min-h-screen bg-white ${theme.text} overflow-x-hidden selection:bg-[#ec4899] selection:text-white`}>
      {/* Running Announcement Bar - Pastel Green Theme */}
      <div className="bg-[#f0f9f1] border-b border-emerald-100/30 py-2.5 overflow-hidden relative z-[60]">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[10px] md:text-xs font-black text-emerald-800 uppercase tracking-[0.2em] px-4">
            ✨ Promo Spesial: Beli 2 Gratis 1 untuk semua varian Roti Manis setiap hari Jumat! 🥐 Nikmati kelezatan premium kami langsung dari oven! 🍰 Buka setiap hari 08:00 - 21:00. ✨
          </span>
          <span className="text-[10px] md:text-xs font-black text-emerald-800 uppercase tracking-[0.2em] px-4">
            ✨ Promo Spesial: Beli 2 Gratis 1 untuk semua varian Roti Manis setiap hari Jumat! 🥐 Nikmati kelezatan premium kami langsung dari oven! 🍰 Buka setiap hari 08:00 - 21:00. ✨
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-[60] bg-white border-b border-gray-100 shadow-sm w-full">
        <div className="w-full px-4 md:px-10 h-20 md:h-24 flex items-center gap-4 md:gap-10">
          {/* Logo - now on extreme left */}
          <div 
            className="h-16 w-16 md:h-24 md:w-24 bg-transparent flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="h-full w-full flex items-center justify-center overflow-hidden">
              <img 
                src={cms?.settings?.web_logo_url || config?.logo_url || "/wudkopi-logo.png"} 
                alt="Logo" 
                className="w-full h-full object-contain" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/wudkopi-logo.png";
                }}
              />
            </div>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center">
            <div className="relative w-full flex">
              <Input 
                placeholder="Search product" 
                className="h-12 bg-gray-50 border-none rounded-l-md rounded-r-none pl-6 text-sm placeholder:text-gray-400 focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="h-12 px-6 rounded-l-none rounded-r-md bg-[#ec4899] hover:bg-[#db2777] shadow-none">
                <Search className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* User Actions - Only Cart now */}
          <div className="flex items-center gap-4 md:gap-6 ml-auto">
            
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-14 px-5 rounded-2xl bg-[#ec4899] text-white hover:bg-[#db2777] shadow-xl shadow-pink-200/50 hover:scale-105 transition-all group border-none"
                >
                  <div className="flex items-center gap-3">
                    <CartIcon className="h-7 w-7 stroke-[3px]" />
                    <span className="hidden lg:inline-block font-black text-sm uppercase tracking-widest">Keranjang</span>
                  </div>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-7 w-7 bg-yellow-400 text-black text-[12px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce-subtle">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white p-0 flex flex-col h-full">
                <div className="p-6 h-full flex flex-col">
                   <h3 className="text-xl font-black mb-6">KERANJANG ANDA</h3>
                   <ScrollArea className="flex-1 pr-4">
                      {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 italic py-20">Keranjang Kosong</div>
                      ) : (
                        <div className="space-y-4">
                           {items.map(item => (
                             <div key={item.product.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex flex-col">
                                   <span className="font-bold text-sm text-[#5d4037]">{item.product.name}</span>
                                   <span className="text-[10px] font-black text-[#ec4899]">Rp {item.product.price.toLocaleString()} x {item.quantity}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                   <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-500 ml-2" onClick={() => removeItem(item.product.id)}><X className="h-4 w-4" /></Button>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                   </ScrollArea>
                   {items.length > 0 && (
                      <div className="pt-6 border-t mt-auto space-y-4">
                         <div className="flex justify-between font-black uppercase tracking-tighter text-lg">
                            <span>Total</span>
                            <span className="text-[#ec4899]">Rp {total.toLocaleString()}</span>
                         </div>
                         <Button onClick={handleWhatsAppCheckout} className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black gap-2 shadow-lg shadow-emerald-200">
                            <MessageCircle className="h-5 w-5" /> CHECKOUT WHATSAPP
                         </Button>
                      </div>
                   )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {/* Row 3 - Navigation Links */}
        <nav className="bg-gradient-to-r from-emerald-50 via-[#f0f9f1] to-emerald-50 border-t border-b border-emerald-100/30 w-full hidden md:block">
           <div className="w-full px-10 h-14 flex items-center justify-start">
              <ul className="flex items-center gap-12">
                  {[
                    { label: 'Beranda', id: 'home' },
                    { label: 'Tentang Kami', id: 'about' },
                    { label: 'Toko', id: 'store-section' },
                    { label: 'Gallery', id: 'gallery' },
                    { label: 'Hubungi Kami', id: 'contact' },
                  ].map((item) => (
                    <li key={item.id}>
                      <button 
                        onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-base md:text-lg font-classic font-bold text-gray-800 hover:text-[#ec4899] transition-all relative group tracking-normal"
                      >
                        {item.label}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ec4899] transition-all group-hover:w-full" />
                      </button>
                    </li>
                  ))}
              </ul>
           </div>
        </nav>
      </header>

      <div className="w-full px-2 md:px-6 py-6 md:py-10 flex flex-col lg:flex-row gap-6 md:gap-10 items-start">
        {/* Sidebar Kategori - Fixed & Clean like Image */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
           <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
                 <Filter className="h-4 w-4 text-[#ec4899]" />
                 Semua Kategori
              </h3>
              <div className="space-y-1">
                 <button 
                   onClick={() => setSelectedCategory('all')}
                   className={cn(
                     "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-sm font-bold group",
                     selectedCategory === 'all' ? "text-[#ec4899] bg-[#ec4899]/5 shadow-sm" : "text-gray-600 hover:bg-gray-50"
                   )}
                 >
                    <div className="h-10 w-10 rounded-lg bg-pink-100/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                       <img src="https://cdn-icons-png.flaticon.com/512/1232/1232728.png" className="h-6 w-6 object-contain opacity-80" alt="All" />
                    </div>
                    Semua Produk
                 </button>
                 {!categories ? (
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="h-10 w-full bg-gray-50 animate-pulse rounded-lg" />
                    ))
                 ) : (
                   categories.map((cat: any) => {
                     const getIcon = (name: string) => {
                       const n = name.toLowerCase();
                       if (n.includes('roti')) return "https://cdn-icons-png.flaticon.com/512/2830/2830305.png";
                       if (n.includes('pastry') || n.includes('croissant')) return "https://cdn-icons-png.flaticon.com/512/3257/3257321.png";
                       if (n.includes('cake')) return "https://cdn-icons-png.flaticon.com/512/3144/3144573.png";
                       if (n.includes('dessert') || n.includes('box')) return "https://cdn-icons-png.flaticon.com/512/4601/4601138.png";
                       return "https://cdn-icons-png.flaticon.com/512/3144/3144573.png";
                     };

                     return (
                       <button 
                         key={cat.id}
                         onClick={() => setSelectedCategory(cat.id)}
                         className={cn(
                           "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-sm font-bold group border-b border-gray-50 last:border-0",
                           selectedCategory === cat.id ? "text-[#ec4899] bg-[#ec4899]/5 shadow-sm" : "text-gray-600 hover:bg-gray-50"
                         )}
                       >
                          <div className="h-10 w-10 rounded-lg bg-[#f0f9f1] flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-110 transition-transform">
                             <img src={getIcon(cat.name)} className="h-6 w-6 object-contain opacity-80" alt={cat.name} />
                          </div>
                          <span className="truncate">{cat.name}</span>
                       </button>
                     );
                   })
                 )}
              </div>
           </div>

           {/* Mobile Quick Promo */}
           <div className="bg-gradient-to-br from-[#ec4899] to-pink-400 rounded-xl p-6 text-white overflow-hidden relative group">
              <div className="relative z-10 space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Promo Minggu Ini</p>
                 <h4 className="text-lg font-black leading-tight">Diskon 20% Member Baru!</h4>
                 <Button variant="secondary" className="w-full rounded-lg bg-white text-[#ec4899] font-black text-[10px] h-9">
                    Daftar
                 </Button>
              </div>
           </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-10">
          {/* Main Hero Section - Realigned next to Sidebar */}
          <section className="relative h-[400px] md:h-[550px] w-full rounded-2xl md:rounded-[2rem] overflow-hidden bg-gray-100 group">
            {/* Carousel Images */}
            {heroImages.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-1000",
                  idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-110"
                )} 
                alt={`Slide ${idx}`}
              />
            ))}
            
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
            
            {/* Slide Indicators */}
            {heroImages.length > 1 && (
              <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                {heroImages.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={cn(
                      "h-1.5 transition-all rounded-full",
                      idx === currentSlide ? "w-8 bg-[#ec4899]" : "w-2 bg-[#ec4899]/20"
                    )}
                  />
                ))}
              </div>
            )}
            
            <div className="relative h-full flex flex-col justify-end p-8 md:p-16 space-y-4 md:space-y-6 max-w-2xl z-10">
              {activeHeroProduct ? (
                <div className="space-y-6 drop-shadow-2xl animate-fade-in-up">
                  <div className="space-y-2">
                    <Badge className="bg-[#ec4899] text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest text-[9px] border-none shadow-lg">
                      {activeHeroProduct.categories?.name || 'Pilihan Terbaik'}
                    </Badge>
                    <h1 className="text-4xl md:text-7xl font-black text-white leading-[0.9] uppercase tracking-tighter drop-shadow-lg">
                      {activeHeroProduct.name}
                    </h1>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl flex items-baseline gap-2 border border-white/20">
                      <span className="text-[10px] font-black text-[#ec4899] uppercase">Harga</span>
                      <span className="text-2xl md:text-4xl font-black text-[#5d4037] tracking-tighter">
                        Rp {activeHeroProduct.price.toLocaleString()}
                      </span>
                    </div>
                    <Button 
                      onClick={() => handleAddToCart(activeHeroProduct)}
                      className="h-14 md:h-16 px-8 rounded-2xl bg-[#ec4899] hover:bg-[#db2777] text-white font-black text-xs md:text-sm uppercase tracking-widest shadow-xl shadow-pink-200/50 gap-3 hover:scale-105 transition-transform"
                    >
                      <Plus className="h-5 w-5" /> PESAN SEKARANG
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 drop-shadow-2xl">
                  <div className="space-y-2">
                     <p className="text-[#ec4899] font-black text-xs md:text-sm uppercase tracking-[0.3em] animate-fade-in drop-shadow-md">
                       {hero.secondary_cta_text || "Tentang Kami"}
                     </p>
                     <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                        {hero.title || "cake n bake fresh from oven"}
                     </h1>
                  </div>
                  <p className="text-white/90 text-sm md:text-base font-medium leading-relaxed max-w-md drop-shadow-md italic">
                    {hero.subtitle || "Temukan berbagai pilihan menu premium yang dibuat dengan penuh kasih sayang untuk setiap momen berharga Anda."}
                  </p>
                  <div className="pt-4">
                    <Button 
                      size="lg" 
                      onClick={() => (document.getElementById('store-section')?.scrollIntoView({behavior: 'smooth'}))}
                      className="rounded-xl h-12 md:h-14 px-8 md:px-12 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase text-xs tracking-widest shadow-2xl shadow-yellow-400/40 hover:scale-105 transition-transform"
                    >
                      {hero.cta_text || "Belanja Sekarang"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Full Store Catalog */}
          <section id="store-section" className="py-12 md:py-16 px-0 relative w-full">
            <div className="w-full px-0 md:px-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white/50 backdrop-blur-md p-6 md:p-12 rounded-none border-y border-pink-100/50 shadow-sm">
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight uppercase leading-tight">
                    PILIHAN <span className={theme.accent}>MENU</span>
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-muted-foreground text-sm font-medium">Temukan kelezatan premium kami.</p>
                    <Badge variant="outline" className="rounded-full border-pink-200 text-[#ec4899] font-black text-[10px] uppercase">
                      {filteredProducts.length} Produk
                    </Badge>
                  </div>
                </div>

                {/* Category Filter & Search - Bakery Theme */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative group w-full md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ec4899] opacity-40 group-focus-within:opacity-100 transition-all" />
                    <Input 
                      placeholder="Cari menu favorit..." 
                      className="pl-12 h-14 bg-white border-pink-100 text-[#5d4037] placeholder:text-[#5d4037]/40 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#ec4899]/20 focus:border-[#ec4899] transition-all font-medium"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

          {/* Category Tabs - Sticky for better access */}
          <div className="sticky top-16 z-40 flex items-center gap-2 overflow-x-auto pb-6 no-scrollbar scroll-smooth bg-gradient-to-b from-[#f0f9f1] via-[#f0f9f1]/90 to-transparent pt-4 mb-8 -mx-4 px-4">
            <button 
              onClick={() => setSelectedCategory("all")}
              className={`whitespace-nowrap px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm ${selectedCategory === "all" ? theme.button : 'bg-white text-[#5d4037] border border-pink-100 hover:bg-pink-50'}`}
            >
              SEMUA MENU
            </button>
            {categories?.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm ${selectedCategory === cat.id ? theme.button : "bg-white text-[#5d4037] border border-pink-100 hover:bg-pink-50"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid - 2 Column Mobile */}
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#ec4899]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
              {filteredProducts?.map((product) => (
                <div key={product.id} className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-100 hover:shadow-2xl transition-all duration-700">
                  {/* Full Frame Image */}
                  <img 
                    src={product.image_url || "/placeholder.svg"} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Floating Price Badge */}
                  <div className="absolute top-5 right-5 z-10">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20 flex items-baseline gap-1">
                      <span className="text-[10px] font-black text-[#ec4899]">Rp</span>
                      <span className="text-lg font-black text-[#5d4037] tracking-tighter">
                        {product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Floating Content Area (Bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 space-y-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-lg bg-[#ec4899] text-white border-none mb-2">
                        {product.categories?.name || "Premium"}
                      </Badge>
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight drop-shadow-lg">
                        {product.name}
                      </h3>
                    </div>

                    <Button 
                      onClick={() => handleAddToCart(product)}
                      className="w-full h-12 md:h-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white font-black text-xs md:text-sm uppercase tracking-widest hover:bg-[#ec4899] hover:border-transparent transition-all shadow-xl group/btn"
                    >
                      <Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform" />
                      TAMBAH KE KERANJANG
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section - For Navigation */}
      <section id="gallery" className="py-20 px-4 md:px-10 bg-white">
        <div className="space-y-2 mb-12 text-center">
           <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#1a1a1a] uppercase">Gallery Kreasi</h2>
           <p className="text-gray-500 font-medium">Inspirasi kue premium untuk momen spesial Anda.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[1,2,3,4].map((i) => (
             <div key={i} className="aspect-square rounded-[2rem] overflow-hidden bg-gray-100 group border border-pink-100 shadow-sm">
                <img 
                  src={`https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800&sig=${i}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt="Gallery"
                />
             </div>
           ))}
        </div>
      </section>

      {/* Value Proposition - Full Width */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-16 relative bg-gray-50/50">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          {[
            { icon: <Zap className="h-8 w-8" />, title: "Cepat & Segar", desc: "Setiap pesanan diproses seketika untuk menjaga kualitas terbaik." },
            { icon: <ShieldCheck className="h-8 w-8" />, title: "Kualitas Terjamin", desc: "Bahan baku pilihan yang telah melewati seleksi ketat standar kami." },
            { icon: <Smartphone className="h-8 w-8" />, title: "Pesan Dimana Saja", desc: "Web store responsif yang memudahkan pemesanan dari perangkat Anda." }
          ].map((item, i) => (
            <div key={i} className={`p-10 rounded-[3rem] ${theme.card} group transition-all duration-500 hover:-translate-y-2`}>
              <div className={`h-16 w-16 rounded-[1.5rem] ${theme.button} flex items-center justify-center text-white mb-8 group-hover:rotate-12 transition-transform shadow-lg`}>
                {item.icon}
              </div>
              <h3 className="text-2xl font-black tracking-tighter mb-4 uppercase">{item.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About Section - Full Width */}
      <section id="about" className="py-16 md:py-32 px-4 md:px-16 bg-white w-full">
        <div className="w-full flex flex-col lg:flex-row items-center gap-12 md:gap-32">
          <div className="flex-1 space-y-8">
            <div className={`inline-block px-4 py-2 rounded-2xl ${theme.badge} text-[10px] font-black uppercase tracking-[0.3em]`}>
              {cms?.about?.badge || "Legacy of Taste"}
            </div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
              {cms?.about?.title || "Didesain Untuk Anda"}
            </h2>
            <p className="text-muted-foreground text-xl font-medium leading-relaxed">
              {cms?.about?.description || "Kami mengutamakan kualitas dan kenyamanan pelanggan dalam setiap sajian yang kami berikan."}
            </p>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(cms?.about?.items || [
                {icon: "Coffee", text: "Coffee Shop & Café"},
                {icon: "ShoppingBag", text: "Retail & Minimarket"},
                {icon: "ShieldCheck", text: "Jasa & Layanan"}
              ]).map((item: any, i: number) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className={`h-12 w-12 rounded-2xl ${theme.card} flex items-center justify-center ${theme.accent} group-hover:${theme.button} group-hover:text-white transition-all shadow-sm`}>
                    <IconComponent name={item.icon} className="h-6 w-6" />
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-6">
            <div className="space-y-6 pt-12">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-pink-100 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800" alt="Cafe" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-square rounded-[3rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-pink-100 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800" alt="Retail" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="aspect-square rounded-[3rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-pink-100 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=800" alt="Coffee" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-pink-100 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1521333249782-fa9297670732?auto=format&fit=crop&q=80&w=800" alt="Service" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

        </main>
      </div>

      {/* Footer - Full Width */}
      <footer id="contact" className="py-12 md:py-20 border-t border-pink-100 bg-white w-full">
        <div className="w-full px-6 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16">
          <div className="md:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-20 w-20 md:h-28 md:w-28 bg-transparent flex items-center justify-center p-1">
                <div className="h-full w-full flex items-center justify-center overflow-hidden">
                  <img src={cms?.settings?.web_logo_url || config?.logo_url || "/wudkopi-logo.png"} alt="Logo" className="h-full w-full object-contain" />
                </div>
              </div>
            </div>
            <p className="text-[#5d4037]/60 font-medium max-w-sm leading-relaxed">Penyedia kue dan roti premium dengan cita rasa istimewa setiap harinya.</p>
            <div className="flex gap-4">
              {['Instagram', 'Facebook', 'TikTok'].map(platform => (
                <button key={platform} className="h-10 w-10 rounded-full border border-pink-100 flex items-center justify-center hover:bg-[#ec4899] hover:text-white transition-all text-[10px] font-black uppercase text-[#5d4037]">{platform[0]}</button>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-[#ec4899]">Tautan Cepat</h4>
            <ul className="space-y-4 text-sm font-bold text-[#5d4037]/60">
              <li><a href="#" className="hover:text-[#ec4899] transition-colors">Menu Favorit</a></li>
              <li><a href="#" className="hover:text-[#ec4899] transition-colors">Promo Spesial</a></li>
              <li><a href="#" className="hover:text-[#ec4899] transition-colors">Lokasi Toko</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-[#ec4899]">Bantuan</h4>
            <ul className="space-y-4 text-sm font-bold text-[#5d4037]/60">
              <li><a href="#" className="hover:text-[#ec4899] transition-colors">Cara Pemesanan</a></li>
              <li><a href="#" className="hover:text-[#ec4899] transition-colors">Hubungi Kami</a></li>
              <li><a href="#" className="hover:text-[#ec4899] transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div className="w-full px-6 md:px-16 mt-20 pt-8 border-t border-pink-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-black text-[#5d4037]/40 uppercase tracking-widest">© 2026 {storeName} POS System. crafted for excellence.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-[#5d4037]/40">
            <a href="#" className="hover:text-[#ec4899] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#ec4899] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
