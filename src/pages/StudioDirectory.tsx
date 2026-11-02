import React, { useState, useEffect } from "react";
import { Search, Star, Heart, CheckCircle2, ShieldAlert, SlidersHorizontal, MapPin, Map, LayoutGrid, Layers, X, Filter, Sparkles, Eye, ArrowRight, Globe, Share2, GitCompareArrows, Printer, Clock3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Interactive3DTiltCard, MagnetButton } from "../components/MotionCard.tsx";
import CaintaStudioMap from "../components/CaintaStudioMap.tsx";
import { SoundEngine } from "../utils/soundEffects.ts";
import { rankStudiosForRecommendation } from "../utils/studioRecommendation.ts";

interface StudioDirectoryProps {
  studios: any[];
  categories: any[];
  services: any[];
  packages: any[];
  onNavigate: (page: string, params?: any) => void;
  favorites: any[];
  onToggleFavorite: (studioId: string) => void;
  initialParams?: any;
}

export default function StudioDirectory({
  studios,
  categories,
  services,
  packages,
  onNavigate,
  favorites,
  onToggleFavorite,
  initialParams
}: StudioDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState(initialParams?.search || "");
  const [selectedCategory, setSelectedCategory] = useState(initialParams?.category || "All");
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [minRating, setMinRating] = useState<number>(0);
  const [filteredStudios, setFilteredStudios] = useState<any[]>(studios);
  const [viewMode, setViewMode] = useState<"grid" | "map" | "both">(initialParams?.view === "map" ? "map" : "both");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [previewStudio, setPreviewStudio] = useState<any | null>(null);
  const [comparisonStudioIds, setComparisonStudioIds] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const comparisonStudios = comparisonStudioIds
    .map(id => studios.find(studio => studio.id === id))
    .filter(Boolean);
  const rankedComparisonStudios = rankStudiosForRecommendation(comparisonStudios);
  const recommendedStudio = rankedComparisonStudios[0];
  const bestRatedStudio = [...comparisonStudios].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
  )[0];
  const lowestPriceStudio = [...comparisonStudios].sort(
    (a, b) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0)
  )[0];

  const toggleComparisonStudio = (studioId: string) => {
    setComparisonStudioIds(current =>
      current.includes(studioId)
        ? current.filter(id => id !== studioId)
        : [...current, studioId]
    );
  };

  const comparisonRows: { label: string; value: (studio: any) => React.ReactNode }[] = [
    { label: "Starting price", value: studio => `₱${(studio.startingPrice ?? 0).toLocaleString()}` },
    {
      label: "Rating",
      value: studio => `${Number(studio.rating ?? 0).toFixed(1)} / 5 (${studio.reviewCount ?? 0} reviews)`
    },
    {
      label: "Photography concepts",
      value: studio => (studio.categories?.length ? studio.categories.join(", ") : studio.category || "Not listed")
    },
    {
      label: "Services",
      value: studio => {
        const studioServices = services.filter(service => service.studioId === studio.id && service.isActive !== false);
        return studioServices.length ? (
          <ul className="space-y-2">
            {studioServices.map(service => (
              <li key={service.id} className="rounded-lg border border-[#eee9e2] bg-white p-2.5">
                <span className="font-semibold">{service.name}</span>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#7c756d]">
                  {service.category && <span>{service.category}</span>}
                  {Number.isFinite(Number(service.basePrice)) && (
                    <span className="font-semibold text-[#5b554f]">₱{Number(service.basePrice).toLocaleString()}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : "No active services listed";
      }
    },
    {
      label: "Packages",
      value: studio => {
        const studioPackages = packages.filter(pkg => pkg.studioId === studio.id && pkg.isActive !== false);
        return studioPackages.length ? (
          <ul className="space-y-2">
            {studioPackages.map(pkg => (
              <li key={pkg.id} className="rounded-lg border border-[#eee9e2] bg-white p-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <span className="font-semibold">{pkg.name}</span>
                  {Number.isFinite(Number(pkg.price)) && (
                    <span className="font-semibold text-[#5b554f]">₱{Number(pkg.price).toLocaleString()}</span>
                  )}
                </div>
                {pkg.description && (
                  <span className="mt-1 block whitespace-pre-wrap break-words text-[11px] leading-relaxed text-[#7c756d]">
                    {String(pkg.description).replace(/^\s*#{1,6}\s*/gm, "").replace(/\*\*(.*?)\*\*/g, "$1").trim()}
                  </span>
                )}
                {pkg.includedServices?.length > 0 && (
                  <span className="mt-2 block text-[11px] leading-relaxed text-[#5b554f]">
                    <span className="font-semibold">Includes:</span> {pkg.includedServices.join(", ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : "No active packages listed";
      }
    },
    { label: "About", value: studio => studio.description || "No description provided" },
    { label: "Location", value: studio => studio.location || studio.address || "Not listed" },
    {
      label: "Business hours",
      value: studio => studio.businessHours || "Not listed"
    },
    {
      label: "Prints",
      value: studio => studio.printingAvailable ? "Available" : "Not listed"
    },
    {
      label: "Verification",
      value: studio => studio.isApproved ? "Verified" : "Not verified"
    }
  ];

  useEffect(() => {
    let result = studios;

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(s => (s.categories && s.categories.includes(selectedCategory)) || s.category === selectedCategory);
    }

    // Starting Price filter
    result = result.filter(s => s.startingPrice <= priceRange);

    // Rating filter
    if (minRating > 0) {
      result = result.filter(s => s.rating >= minRating);
    }

    setFilteredStudios(result);
  }, [searchQuery, selectedCategory, priceRange, minRating, studios]);

  const activeFilterCount = (searchQuery ? 1 : 0) + (selectedCategory !== "All" ? 1 : 0) + (priceRange < 10000 ? 1 : 0) + (minRating > 0 ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 pb-24 md:pb-12">
      {/* Page Title & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 text-left">
        <div className="space-y-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-800 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={12} className="text-yellow-600" />
            <span className="hidden xs:inline sm:inline">Accredited Cainta Photography Network</span>
            <span className="xs:hidden sm:hidden">Cainta Studios</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-[#2c2a29]">Explore Photography Studios</h2>
          <p className="text-xs text-gray-500 font-light hidden sm:block">Find verified studios across Valley Golf, San Roque, Sto. Domingo &amp; Cainta Poblacion</p>
        </div>

        {/* View Switcher & Mobile Filter Trigger */}
        <div className="flex items-center gap-2 flex-shrink-0 justify-between sm:justify-start">
          <button
            onClick={() => {
              SoundEngine.playPop();
              setMobileFilterOpen(!mobileFilterOpen);
            }}
            className="lg:hidden px-3 py-2 bg-white border border-[#e5e1da] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer text-[#2c2a29]"
          >
            <Filter size={15} />
            <span className="hidden xs:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-yellow-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View mode buttons — icon-only on xs, icon+label on sm+ */}
          <div className="bg-white border border-[#e5e1da] p-1 rounded-xl shadow-xs flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => { SoundEngine.playPop(); setViewMode("both"); }}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "both" ? "bg-[#2c2a29] text-white shadow-xs" : "text-[#7c756d] hover:text-[#2c2a29]"
              }`}
              title="Split (Map + Grid)"
            >
              <Layers size={14} />
              <span className="hidden md:inline">Split</span>
            </button>

            <button
              onClick={() => { SoundEngine.playPop(); setViewMode("map"); }}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "map" ? "bg-[#2c2a29] text-white shadow-xs" : "text-[#7c756d] hover:text-[#2c2a29]"
              }`}
              title="Map View"
            >
              <Map size={14} className="text-yellow-500" />
              <span className="hidden sm:inline">Map</span>
            </button>

            <button
              onClick={() => { SoundEngine.playPop(); setViewMode("grid"); }}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-[#2c2a29] text-white shadow-xs" : "text-[#7c756d] hover:text-[#2c2a29]"
              }`}
              title="Grid Only"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
        {/* FILTERS PANEL */}
        <aside className={`lg:col-span-3 bg-white border border-[#e5e1da] rounded-2xl p-5 space-y-6 text-left shadow-sm sticky top-24 ${
          mobileFilterOpen ? "block fixed inset-x-3 top-[68px] z-50 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto" : "hidden lg:block"
        }`}>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 font-display font-bold text-sm text-[#2c2a29]">
              <SlidersHorizontal size={15} className="text-yellow-600" />
              <span>Search & Filter</span>
            </div>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-black cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#7c756d] tracking-wider">Studio Keywords</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-[#7c756d]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Cainta studio or road..."
                className="w-full bg-[#faf9f6] border border-[#e5e1da] rounded-xl pl-8.5 pr-3 py-2 text-xs focus:outline-none focus:border-[#2c2a29]"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-[#7c756d] tracking-wider">Photography Concept</label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => { SoundEngine.playPop(); setSelectedCategory("All"); }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs text-left transition-colors font-semibold cursor-pointer ${
                  selectedCategory === "All" ? "bg-[#2c2a29] text-white" : "bg-white text-[#2c2a29] hover:bg-gray-50"
                }`}
              >
                All Categories ({studios.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { SoundEngine.playPop(); setSelectedCategory(cat.name); }}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs text-left transition-colors font-semibold cursor-pointer ${
                    selectedCategory === cat.name ? "bg-[#2c2a29] text-white" : "bg-white text-[#2c2a29] hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold uppercase text-[#7c756d] tracking-wider">
              <span>Max Starting Price</span>
              <span className="text-[#2c2a29] font-black text-xs font-display">₱{priceRange.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="800"
              max="10000"
              step="100"
              value={priceRange}
              onChange={e => setPriceRange(Number(e.target.value))}
              className="w-full accent-[#2c2a29] cursor-pointer"
            />
          </div>

          {/* Minimum Rating */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-[#7c756d] tracking-wider">Studio Rating</label>
            <div className="flex gap-1.5">
              {[0, 4, 4.5, 4.8].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => { SoundEngine.playPop(); setMinRating(stars); }}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    minRating === stars 
                      ? "bg-[#2c2a29] border-[#2c2a29] text-white" 
                      : "bg-white border-[#e5e1da] text-[#7c756d] hover:border-[#7c756d]"
                  }`}
                >
                  {stars === 0 ? "Any" : `${stars}★+`}
                </button>
              ))}
            </div>
          </div>

          {mobileFilterOpen && (
            <button
              onClick={() => { SoundEngine.playFocusBeep(); setMobileFilterOpen(false); }}
              className="w-full py-2.5 bg-[#2c2a29] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Apply Filters ({filteredStudios.length} Studios)
            </button>
          )}
        </aside>

        {/* RESULTS */}
        <main className="lg:col-span-9 space-y-6 min-w-0">
          <div className="flex justify-between items-center text-xs text-gray-500 gap-2 min-w-0">
            <span className="flex-shrink-0">Showing <strong className="text-[#2c2a29] font-bold">{filteredStudios.length}</strong> accredited studios</span>
            <span className="text-[11px] text-gray-400 hidden sm:inline truncate">All prices include lighting setup &amp; basic retouch</span>
          </div>
          <p className="text-[11px] text-[#7c756d] -mt-4">
            Compare studio ratings, starting prices, photography concepts, hours, and print availability.
          </p>

          {/* INTERACTIVE CAINTA MAP */}
          {(viewMode === "map" || viewMode === "both") && (
            <CaintaStudioMap
              studios={filteredStudios}
              onNavigate={onNavigate}
              height={viewMode === "map" ? "480px" : "360px"}
            />
          )}

          {/* STUDIO CARDS GRID */}
          {(viewMode === "grid" || viewMode === "both") && (
            filteredStudios.length === 0 ? (
              <div className="bg-white border border-[#e5e1da] rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
                <ShieldAlert className="mx-auto text-yellow-600 animate-bounce" size={40} />
                <h4 className="font-display font-bold text-base text-[#2c2a29]">No studios match current filters</h4>
                <p className="text-xs text-[#7c756d] max-w-sm mx-auto">Try resetting keywords, widening the price budget, or choosing 'All Categories'.</p>
                <button
                  onClick={() => {
                    SoundEngine.playPop();
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setPriceRange(10000);
                    setMinRating(0);
                  }}
                  className="px-5 py-2.5 bg-[#2c2a29] text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStudios.map((st) => {
                  const isFav = favorites.some(f => f.studioId === st.id);
                  return (
                    <Interactive3DTiltCard
                      key={st.id}
                      className="bg-white rounded-2xl overflow-hidden border border-[#e5e1da] flex flex-col justify-between h-full w-full shadow-sm hover:shadow-lg transition-shadow"
                    >
                      {/* Cover image */}
                      <div className="h-44 relative bg-gray-100 overflow-hidden group">
                        <img
                          src={st.coverImage || null}
                          alt={st.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            SoundEngine.playPop();
                            onToggleFavorite(st.id);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-gray-500 hover:text-red-500 transition-colors shadow-sm cursor-pointer z-30"
                        >
                          <Heart size={14} className={isFav ? "fill-red-500 text-red-500" : ""} />
                        </button>

                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                          <span className="bg-[#2c2a29]/90 backdrop-blur-sm text-yellow-400 text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-black border border-white/10">
                            Cainta, Rizal
                          </span>
                          {st.isApproved && (
                            <span className="bg-emerald-700/90 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded font-bold flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Studio details */}
                      <div className="p-5 text-left flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
                              <Star size={11} className="fill-yellow-500 text-yellow-500" />
                              {st.rating} ({st.reviewCount} reviews)
                            </span>
                            <span className="text-gray-400 uppercase tracking-wider text-[9px]">
                              {st.category || "Portrait"}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-base text-[#2c2a29] leading-tight line-clamp-1">{st.name}</h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{st.description}</p>
                          
                          {/* Map location string */}
                          <p className="text-[10px] text-gray-600 flex items-center gap-1 font-semibold truncate pt-1">
                            <MapPin size={12} className="text-yellow-600 flex-shrink-0" />
                            {st.location}
                          </p>
                        </div>

                        {/* Footer starting price & Action */}
                        <div className="pt-3 border-t border-[#e5e1da] space-y-2">
                          {(st.facebookUrl || st.instagramUrl || st.tiktokUrl || st.otherSocialUrl || st.websiteUrl) && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {st.facebookUrl && (
                                <a
                                  href={st.facebookUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors shadow-xs"
                                  title="Facebook Page"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                </a>
                              )}
                              {st.instagramUrl && (
                                <a
                                  href={st.instagramUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="p-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg transition-colors shadow-xs"
                                  title="Instagram Profile"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                </a>
                              )}
                              {st.tiktokUrl && (
                                <a
                                  href={st.tiktokUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="p-1.5 bg-gray-100 text-black hover:bg-gray-200 rounded-lg transition-colors shadow-xs"
                                  title="TikTok Profile"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                                </a>
                              )}
                              {st.otherSocialUrl && (
                                <a
                                  href={st.otherSocialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors shadow-xs"
                                  title="Other Social Link"
                                >
                                  <Share2 size={11} />
                                </a>
                              )}
                              {st.websiteUrl && (
                                <a
                                  href={st.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors shadow-xs"
                                  title="Official Website"
                                >
                                  <Globe size={11} />
                                </a>
                              )}
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase block font-bold leading-none">Starts at</span>
                              <span className="text-sm font-black text-[#2c2a29] font-display">₱{st.startingPrice?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-pressed={comparisonStudioIds.includes(st.id)}
                                onClick={() => {
                                  SoundEngine.playPop();
                                  toggleComparisonStudio(st.id);
                                }}
                                className={`px-2.5 py-1.5 border text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
                                  comparisonStudioIds.includes(st.id)
                                    ? "bg-amber-50 border-amber-400 text-amber-900"
                                    : "bg-white border-[#e5e1da] text-[#5b554f] hover:border-amber-400"
                                }`}
                              >
                                <GitCompareArrows size={13} />
                                {comparisonStudioIds.includes(st.id) ? "Added" : "Compare"}
                              </button>
                              <MagnetButton
                                sound="focus"
                                onClick={() => onNavigate("profile", { id: st.id })}
                                className="px-3.5 py-1.5 bg-[#2c2a29] hover:bg-[#4a4644] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                              >
                                Explore & Book
                              </MagnetButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Interactive3DTiltCard>
                  );
                })}
              </div>
            )
          )}
        </main>
      </div>

      {comparisonStudioIds.length > 0 && (
        <div className="fixed inset-x-3 bottom-4 z-[60] mx-auto max-w-3xl rounded-2xl border border-[#e5e1da] bg-white p-3 shadow-2xl sm:bottom-6 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#2c2a29]">
                {comparisonStudioIds.length} studio{comparisonStudioIds.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-[11px] text-[#7c756d]">
                {comparisonStudioIds.length < 2
                  ? "Select at least one more studio to compare."
                  : "Compare studio details and get a recommendation."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setComparisonStudioIds([])}
                className="rounded-xl px-3 py-2 text-xs font-bold text-[#7c756d] hover:bg-gray-50 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={comparisonStudioIds.length < 2}
                onClick={() => setIsComparisonOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2c2a29] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <GitCompareArrows size={15} />
                Compare studios
              </button>
            </div>
          </div>
        </div>
      )}

      {isComparisonOpen && comparisonStudios.length >= 2 && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-2 sm:p-6"
          onClick={() => setIsComparisonOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-comparison-title"
            className="flex max-h-[calc(100dvh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-[#faf9f6] shadow-2xl sm:max-h-[92dvh]"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e5e1da] bg-white p-4 sm:p-6">
              <div>
                <h3 id="studio-comparison-title" className="font-display text-xl font-black text-[#2c2a29]">
                  Studio comparison
                </h3>
                <p className="mt-1 text-xs text-[#7c756d]">
                  Review the details side by side, then choose the studio that fits your needs.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close studio comparison"
                onClick={() => setIsComparisonOpen(false)}
                className="rounded-lg p-2 text-[#7c756d] hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {recommendedStudio && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-amber-950">
                  <Sparkles size={16} />
                  Recommended: {recommendedStudio.studio.name}
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-amber-900">
                    {recommendedStudio.score.toFixed(1)} / 5 match
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-amber-900">
                  This pick scored highest using rating (70%) and starting-price affordability (30%) among your selections.
                  {bestRatedStudio && <> {bestRatedStudio.name} has the highest rating ({Number(bestRatedStudio.rating ?? 0).toFixed(1)} / 5).</>}
                  {lowestPriceStudio && <> {lowestPriceStudio.name} has the lowest starting price (₱{(lowestPriceStudio.startingPrice ?? 0).toLocaleString()}).</>}
                  {" "}Review the service and package details below before deciding; actual prices and inclusions may differ by booking.
                </p>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              <div className="md:hidden">
                {comparisonStudios.map(studio => {
                  const isRecommended = studio.id === recommendedStudio?.studio.id;
                  return (
                    <article
                      key={studio.id}
                      className={`mb-4 overflow-hidden rounded-xl border bg-white ${
                        isRecommended ? "border-amber-300 ring-1 ring-amber-200" : "border-[#e5e1da]"
                      }`}
                    >
                      <div className="flex items-start gap-3 border-b border-[#e5e1da] p-3">
                        <img
                          src={studio.coverImage || undefined}
                          alt=""
                          className="h-16 w-20 shrink-0 rounded-lg bg-gray-100 object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-bold text-[#2c2a29]">{studio.name}</p>
                          {isRecommended && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800">
                              <Sparkles size={11} /> Recommended
                            </span>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsComparisonOpen(false);
                                onNavigate("profile", { id: studio.id });
                              }}
                              className="text-[11px] font-bold text-amber-800 underline underline-offset-2 cursor-pointer"
                            >
                              View studio
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleComparisonStudio(studio.id)}
                              className="text-[11px] font-semibold text-[#7c756d] hover:text-red-600 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      <dl className="divide-y divide-[#eee9e2]">
                        {comparisonRows.map(row => (
                          <div key={row.label} className="grid grid-cols-1 gap-1.5 p-3 sm:grid-cols-[minmax(7rem,0.35fr)_minmax(0,1fr)] sm:gap-3">
                            <dt className="font-semibold text-[#5b554f]">{row.label}</dt>
                            <dd className="min-w-0 break-words text-[#2c2a29] [overflow-wrap:anywhere]">
                              {row.value(studio)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  );
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
              <table
                className="border-separate border-spacing-0 text-left text-xs"
                style={{
                  width: `max(100%, ${150 + comparisonStudios.length * 260}px)`,
                  tableLayout: "fixed"
                }}
              >
                <thead>
                  <tr>
                    <th className="w-[150px] border-b border-[#e5e1da] bg-[#faf9f6] p-3 text-[10px] uppercase tracking-wide text-[#7c756d]">
                      Studio details
                    </th>
                    {comparisonStudios.map(studio => {
                      const isRecommended = studio.id === recommendedStudio?.studio.id;
                      return (
                        <th key={studio.id} className="w-[260px] border-b border-[#e5e1da] bg-white p-3 align-top">
                          <div className="space-y-2">
                            <img
                              src={studio.coverImage || undefined}
                              alt=""
                              className="h-24 w-full rounded-lg bg-gray-100 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-[#2c2a29]">{studio.name}</p>
                                {isRecommended && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800">
                                    <Sparkles size={11} /> Recommended
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                aria-label={`Remove ${studio.name} from comparison`}
                                onClick={() => toggleComparisonStudio(studio.id)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                              >
                                <X size={15} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsComparisonOpen(false);
                                onNavigate("profile", { id: studio.id });
                              }}
                              className="text-[11px] font-bold text-amber-800 underline underline-offset-2 cursor-pointer"
                            >
                              View studio
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map(row => (
                    <tr key={row.label}>
                      <th className="border-b border-[#e5e1da] bg-[#faf9f6] p-3 align-top font-semibold text-[#5b554f]">
                        {row.label === "Starting price" ? <span className="inline-flex items-center gap-1"><span>₱</span>{row.label}</span>
                          : row.label === "Business hours" ? <span className="inline-flex items-center gap-1"><Clock3 size={12} />{row.label}</span>
                          : row.label === "Prints" ? <span className="inline-flex items-center gap-1"><Printer size={12} />{row.label}</span>
                          : row.label === "Location" ? <span className="inline-flex items-center gap-1"><MapPin size={12} />{row.label}</span>
                          : row.label}
                      </th>
                      {comparisonStudios.map(studio => (
                        <td
                          key={studio.id}
                          className={`border-b border-[#e5e1da] p-3 align-top text-[#2c2a29] [overflow-wrap:anywhere] ${
                            studio.id === recommendedStudio?.studio.id ? "bg-amber-50/60" : "bg-white"
                          }`}
                        >
                          {row.value(studio)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
