import React, { useState } from 'react';
import { Boxes, AlertTriangle, CheckCircle2, Search, ArrowUp, Plus, RefreshCw } from 'lucide-react';
import { resolveImageUrl } from '../../../config/api';

export const AdminInventoryTab = ({
  inventoryData = {},
  productsList = [],
  onUpdateStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'low' | 'out'
  const [updatingId, setUpdatingId] = useState(null);

  const products = productsList.length > 0 ? productsList : (inventoryData.products || []);

  const totalUnits = products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
  const totalValuation = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.price || 0)), 0);
  const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
  const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;

  const filteredProducts = products.filter((prod) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || prod.name?.toLowerCase().includes(query) || prod.subcategory?.toLowerCase().includes(query);
    
    if (filterMode === 'low') return matchesSearch && prod.stockQuantity > 0 && prod.stockQuantity <= 10;
    if (filterMode === 'out') return matchesSearch && prod.stockQuantity <= 0;
    return matchesSearch;
  });

  const handleQuickAdjust = async (productId, delta) => {
    setUpdatingId(productId);
    try {
      await onUpdateStock(productId, { adjustment: delta });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6" />
            <span>Inventory Health & Stock Replenishment</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Real-time warehouse inventory valuation, low stock warnings, and instant single-click restock controls.
          </p>
        </div>
      </div>

      {/* Inventory KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Stock Count</span>
          <div className="text-2xl font-black font-heading text-white font-mono">{totalUnits} units</div>
          <div className="text-[10px] text-zinc-400">Across {products.length} product SKUs</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Inventory Valuation</span>
          <div className="text-2xl font-black font-heading text-white font-mono">₹{totalValuation.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-zinc-400">Total catalog inventory value</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-1">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Low Stock Warnings</span>
          <div className="text-2xl font-black font-heading text-amber-400 font-mono">{lowStockCount} items</div>
          <div className="text-[10px] text-amber-300/80">Stock ≤ 10 units</div>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 space-y-1">
          <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider">Out of Stock Alerts</span>
          <div className="text-2xl font-black font-heading text-red-400 font-mono">{outOfStockCount} items</div>
          <div className="text-[10px] text-red-300/80">Immediate restock required</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter inventory by product name or collection..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          {[
            { id: 'all', label: `All (${products.length})` },
            { id: 'low', label: `Low Stock (${lowStockCount})` },
            { id: 'out', label: `Out of Stock (${outOfStockCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterMode === tab.id
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[10px] font-mono tracking-wider">
                <th className="p-3.5">Product SKU</th>
                <th className="p-3.5">Collection</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Stock Status</th>
                <th className="p-3.5 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProducts.map((prod) => (
                <tr key={prod._id || prod.id} className="hover:bg-zinc-800/40 transition-colors">
                  
                  {/* Thumbnail & Title */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveImageUrl(prod.images?.front || prod.image)}
                        alt={prod.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                        className="w-10 h-14 object-cover rounded-lg border border-zinc-800 bg-zinc-950"
                      />
                      <div className="max-w-[220px]">
                        <div className="font-bold text-white text-xs truncate">{prod.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">SKU: {String(prod._id || prod.id).substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>

                  {/* Collection */}
                  <td className="p-3.5 text-zinc-300">
                    {prod.subcategory || 'Streetwear'}
                  </td>

                  {/* Price */}
                  <td className="p-3.5 font-mono font-bold text-white">
                    ₹{prod.price}
                  </td>

                  {/* Current Stock */}
                  <td className="p-3.5 font-mono">
                    <span className="text-sm font-black text-white">{prod.stockQuantity}</span>
                    <span className="text-[10px] text-zinc-400 ml-1">units</span>
                  </td>

                  {/* Stock Status Badge */}
                  <td className="p-3.5">
                    {prod.stockQuantity <= 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold uppercase">
                        ✕ Out of Stock
                      </span>
                    ) : prod.stockQuantity <= 10 ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                        ⚠️ Low Stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase">
                        ✓ In Stock
                      </span>
                    )}
                  </td>

                  {/* Instant Restock Buttons */}
                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {[+5, +10, +25].map((delta) => (
                        <button
                          key={delta}
                          disabled={updatingId === (prod._id || prod.id)}
                          onClick={() => handleQuickAdjust(prod._id || prod.id, delta)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-mono font-bold border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          +{delta}
                        </button>
                      ))}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
