import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Users,
  Truck,
  Boxes,
  CreditCard,
  TrendingUp,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X,
  Menu,
  Store
} from 'lucide-react';

export const AdminLayout = ({
  activeTab,
  setActiveTab,
  onLogout,
  onClose,
  onOpenAddProduct,
  adminUser,
  counts = {},
  notifications = [],
  unreadNotifsCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  globalSearchQuery = '',
  setGlobalSearchQuery = () => {},
  children
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isStoreOwner = adminUser?.role === 'store_owner';

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'orders', label: 'Orders', icon: Package, badge: counts.orders || null },
    { id: 'products', label: 'Products', icon: ShoppingBag, badge: counts.products || null },
    { id: 'categories', label: 'Categories', icon: Tags, badge: counts.categories || null },
    { id: 'customers', label: 'Customers', icon: Users, badge: counts.customers || null },
    { id: 'delivery', label: 'Delivery Partners', icon: Truck, badge: counts.delivery || null },
    { id: 'stores', label: 'Store Management', icon: Store, badge: counts.stores || null },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: counts.lowStock ? `${counts.lowStock} Low` : null, badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: null },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount || null, badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  const menuItems = allMenuItems.filter(item => {
    if (isStoreOwner) {
      return ['dashboard', 'orders', 'products', 'categories', 'inventory', 'analytics', 'notifications'].includes(item.id);
    }
    return true;
  });

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    setIsNotifDropdownOpen(false);
    setIsProfileDropdownOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (DESKTOP & TABLET) */}
      {/* ========================================================= */}
      <aside
        className={`hidden md:flex flex-col bg-zinc-900/95 border-r border-zinc-800/80 transition-all duration-300 relative z-30 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-black text-lg shadow-sm font-heading shrink-0">
                ⚡
              </div>
              <div className="truncate">
                <span className="font-heading font-black text-base text-white tracking-tight block">
                  {isStoreOwner ? 'Store Owner' : 'QuickFit Admin'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
                  {isStoreOwner ? 'Store Portal' : 'Enterprise Suite'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-black text-lg shadow-sm font-heading">
                ⚡
              </div>
            </div>
          )}
 
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white items-center justify-center transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
 
        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
 
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
                title={isSidebarCollapsed ? item.label : ''}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-white group-hover:scale-110'}`} />
 
                {!isSidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
 
                {!isSidebarCollapsed && item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${item.badgeColor || (isActive ? 'bg-zinc-950/10 text-zinc-950 border-zinc-950/20' : 'bg-zinc-800 text-zinc-300 border-zinc-700')}`}>
                    {item.badge}
                  </span>
                )}
 
                {/* Tooltip on Collapsed */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1 bg-zinc-900 text-white text-[11px] font-bold rounded-md whitespace-nowrap shadow-xl border border-zinc-800 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}
        </div>
 
        {/* Sidebar Footer / User & Logout */}
        <div className="p-3 border-t border-zinc-800 space-y-2">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-xs text-white shrink-0">
                  {adminUser?.name?.charAt(0) || 'A'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {adminUser?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {isStoreOwner ? 'Store Manager' : 'Super Admin'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={onLogout}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-red-950/50 hover:text-red-300 text-zinc-400 flex items-center justify-center transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE DRAWER SIDEBAR */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          <div className="relative w-4/5 max-w-xs bg-zinc-900 border-r border-zinc-800 flex flex-col h-full z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-black text-base font-heading">
                  ⚡
                </div>
                <span className="font-heading font-black text-white text-base">QuickFit Admin</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white text-zinc-950 shadow-md'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${item.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={onLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 hover:bg-red-900/50 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT CONTAINER */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950">
        
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between shrink-0 gap-4 z-20">
          
          {/* Left: Mobile Menu & Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Quick Search */}
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search orders, products, customers..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 font-medium"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions, Live Status, Notifications & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Live Server Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-[10px] font-mono text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE SERVER</span>
            </div>

            {/* View Storefront / Customer Website */}
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-zinc-700/60 transition-colors cursor-pointer"
                title="Return to Customer Storefront (/)"
              >
                <span>🌐</span>
                <span className="hidden sm:inline">View Website</span>
              </button>
            )}

            {/* Quick Add Product Action */}
            <button
              onClick={onOpenAddProduct}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Add New Product"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Product</span>
            </button>

            {/* Notifications Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white flex items-center justify-center relative transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-zinc-900">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-xs text-white">Notifications</span>
                      {unreadNotifsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-mono font-bold border border-red-500/30">
                          {unreadNotifsCount} unread
                        </span>
                      )}
                    </div>
                    {unreadNotifsCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-[10px] text-zinc-400 hover:text-white font-bold underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        No notifications to display.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            onMarkNotificationRead(n._id);
                            if (n.type === 'order') setActiveTab('orders');
                            if (n.type === 'inventory') setActiveTab('inventory');
                            setIsNotifDropdownOpen(false);
                          }}
                          className={`p-3 text-xs hover:bg-zinc-800/50 transition-colors cursor-pointer flex items-start gap-2.5 ${
                            !n.isRead ? 'bg-zinc-800/20' : ''
                          }`}
                        >
                          <span className="text-base mt-0.5">
                            {n.type === 'order' ? '📦' : n.type === 'inventory' ? '⚠️' : n.type === 'delivery' ? '🚚' : 'ℹ️'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white flex items-center justify-between">
                              <span className="truncate">{n.title}</span>
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-zinc-800 bg-zinc-950/40 text-center">
                    <button
                      onClick={() => {
                        setActiveTab('notifications');
                        setIsNotifDropdownOpen(false);
                      }}
                      className="text-[11px] font-bold text-zinc-400 hover:text-white underline"
                    >
                      View All Notification History ➔
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white text-zinc-950 flex items-center justify-center font-black text-xs">
                  {adminUser?.name?.charAt(0) || 'A'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-zinc-200">
                  {adminUser?.adminId || adminUser?.name?.split(' ')[0] || 'Admin'}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 text-xs">
                  <div className="px-3.5 py-2 border-b border-zinc-800">
                    <div className="font-bold text-white truncate">{adminUser?.name || 'Administrator'}</div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">{adminUser?.email || 'admin@quickfit.com'}</div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Store Settings</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3.5 py-2 text-red-400 hover:text-red-300 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-950 space-y-6">
          {children}
        </main>
      </div>

    </div>
  );
};
