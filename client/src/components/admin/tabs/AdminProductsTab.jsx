import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Camera,
  Layers,
  ArrowUpDown,
  Eye,
  AlertCircle
} from 'lucide-react';
import { resolveImageUrl } from '../../../config/api';

export const AdminProductsTab = ({
  productsList = [],
  categories = [],
  onOpenAddProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onToggleProductStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const filteredProducts = productsList.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSub = selectedSubcategory === 'All' || prod.subcategory === selectedSubcategory;
    const query = searchTerm.toLowerCase().trim();
    if (!query) return matchesCategory && matchesSub;

    const matchesName = prod.name?.toLowerCase().includes(query);
    const matchesSubcat = prod.subcategory?.toLowerCase().includes(query);
    const matchesDesc = prod.description?.toLowerCase().includes(query);

    return matchesCategory && matchesSub && (matchesName || matchesSubcat || matchesDesc);
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6" />
            <span>Product Catalog & Multi-Angle Gallery</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Manage clothing inventory with 4 high-definition angle views: Front, Back, Left, and Right.
          </p>
        </div>

        <button
          onClick={onOpenAddProduct}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product (4 Angles)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title, subcategory, or description..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
          />
        </div>

        {/* Categories & Subcategories Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-bold cursor-pointer"
          >
            <option value="All">All Subcategories</option>
            <option value="Oversized T-Shirts">Oversized T-Shirts</option>
            <option value="Drop Shoulder T-Shirts">Drop Shoulder T-Shirts</option>
            <option value="Polo T-Shirts">Polo T-Shirts</option>
            <option value="Shirts">Shirts</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="p-3.5">Front View</th>
                  <th className="p-3.5">Product Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price & MRP</th>
                  <th className="p-3.5">4-Angle Status</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Availability</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-zinc-500 space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-zinc-600" />
                      <div>No products found matching your search.</div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const angleCount = prod.images
                      ? [prod.images.front, prod.images.back, prod.images.left, prod.images.right].filter(Boolean).length
                      : (prod.gallery ? prod.gallery.length : 1);

                    return (
                      <tr key={prod._id || prod.id} className="hover:bg-zinc-800/40 transition-colors">
                        
                        {/* Front View Thumbnail */}
                        <td className="p-3.5">
                          <img
                            src={resolveImageUrl(prod.images?.front || prod.image)}
                            alt={prod.name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/placeholder-product.jpg';
                            }}
                            className="w-12 h-16 object-cover rounded-xl border border-zinc-800 bg-zinc-950 shadow-sm"
                          />
                        </td>

                        {/* Product Title */}
                        <td className="p-3.5 max-w-[200px]">
                          <div className="font-bold text-white text-xs truncate">{prod.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{prod.boutique || 'QuickFit Central'}</div>
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-semibold text-[10px]">
                            {prod.subcategory || prod.category || 'Oversized'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="p-3.5 font-mono">
                          <div className="font-black text-white text-xs">₹{prod.price}</div>
                          {prod.originalPrice && (
                            <div className="text-[10px] text-zinc-500 line-through">₹{prod.originalPrice}</div>
                          )}
                        </td>

                        {/* 4-Angle Status */}
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1.5 border ${
                            angleCount === 4
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : angleCount >= 2
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            <Camera className="w-3 h-3" />
                            <span>{angleCount} / 4 Views</span>
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="p-3.5 font-mono">
                          {prod.stockQuantity <= 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                              0 (Out)
                            </span>
                          ) : prod.stockQuantity <= 10 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              {prod.stockQuantity} (Low)
                            </span>
                          ) : (
                            <span className="text-zinc-200 font-bold text-xs">
                              {prod.stockQuantity} units
                            </span>
                          )}
                        </td>

                        {/* Availability Toggle */}
                        <td className="p-3.5">
                          <button
                            onClick={() => onToggleProductStock(prod._id || prod.id, !prod.inStock)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border transition-colors cursor-pointer ${
                              prod.inStock && prod.stockQuantity > 0
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                : 'bg-red-950/60 border-red-800 text-red-300'
                            }`}
                          >
                            {prod.inStock && prod.stockQuantity > 0 ? '✓ Active' : '✕ Disabled'}
                          </button>
                        </td>

                        {/* Created Date */}
                        <td className="p-3.5 text-zinc-400 font-mono text-[11px]">
                          {prod.createdAt
                            ? new Date(prod.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Today'}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => onOpenEditProduct(prod)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Edit Product & Angles"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => onDeleteProduct(prod._id || prod.id, prod.name)}
                            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const angleCount = prod.images
              ? [prod.images.front, prod.images.back, prod.images.left, prod.images.right].filter(Boolean).length
              : 1;

            return (
              <div
                key={prod._id || prod.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group hover:border-zinc-700 transition-colors"
              >
                <div className="relative aspect-[3/4] w-full bg-zinc-950 overflow-hidden">
                  <img
                    src={resolveImageUrl(prod.images?.front || prod.image)}
                    alt={prod.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-zinc-950/80 backdrop-blur-xs text-[10px] font-mono text-white font-bold border border-zinc-800">
                    {angleCount} / 4 Views
                  </div>
                  {prod.stockQuantity <= 10 && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider">
                      {prod.stockQuantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      {prod.subcategory || 'Streetwear'}
                    </span>
                    <h4 className="font-heading font-black text-white text-sm line-clamp-1 mt-0.5">
                      {prod.name}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-black text-white font-mono text-base">₹{prod.price}</span>
                      {prod.originalPrice && (
                        <span className="text-xs text-zinc-500 line-through font-mono">₹{prod.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400 font-mono">
                      Stock: <strong className="text-white">{prod.stockQuantity}</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditProduct(prod)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteProduct(prod._id || prod.id, prod.name)}
                        className="p-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
