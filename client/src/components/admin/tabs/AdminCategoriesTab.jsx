import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Tags, Plus, Edit2, Trash2, Upload, X, ImageIcon, CheckCircle2 } from 'lucide-react';

export const AdminCategoriesTab = ({
  categories = [],
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  apiBaseUrl = '',
  getAuthHeader = () => ({ headers: {} })
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    subcategories: '',
    isActive: true
  });

  // --- Image Upload State (mirrors Product 4-angle uploader) ---
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState('');
  const [categoryImageError, setCategoryImageError] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading' | 'success' | 'error' | ''
  const categoryImageRef = useRef(null);

  // ── Open Add Modal ──────────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
      subcategories: 'Heavyweight Boxy, Acid Wash, Raw Cotton',
      isActive: true
    });
    setCategoryImageFile(null);
    setCategoryImagePreview('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop');
    setCategoryImageError('');
    setUploadStatus('');
    setIsModalOpen(true);
  };

  // ── Open Edit Modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      subcategories: Array.isArray(cat.subcategories) ? cat.subcategories.join(', ') : '',
      isActive: cat.isActive !== undefined ? cat.isActive : true
    });
    setCategoryImageFile(null);
    // Show existing image as initial preview
    setCategoryImagePreview(cat.image || '');
    setCategoryImageError('');
    setUploadStatus('');
    setIsModalOpen(true);
  };

  // ── Close Modal ─────────────────────────────────────────────────────────────
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryImageFile(null);
    setCategoryImagePreview('');
    setCategoryImageError('');
    setUploadStatus('');
  };

  // ── File Picker Handler (mirrors handleAngleFileChange in AdminDashboardModal) ─
  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setCategoryImageError('');
    setUploadStatus('');
    if (!file) return;

    // Validate MIME type + extension
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpg|jpeg|png|webp)$/i;
    if (!validTypes.includes(file.type) && !validExtensions.test(file.name)) {
      const msg = 'Invalid format. Use JPG, PNG, or WEBP only.';
      setCategoryImageError(msg);
      return;
    }

    // Validate size ≤ 5 MB
    if (file.size > 5 * 1024 * 1024) {
      const msg = 'File size exceeds 5 MB limit. Please choose a smaller image.';
      setCategoryImageError(msg);
      return;
    }

    // Instant local preview via FileReader (same technique as product uploader)
    // Clear formData.image so the URL field is blank — the file takes priority
    setFormData(prev => ({ ...prev, image: '' }));
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCategoryImageFile(file);
        setCategoryImagePreview(event.target.result);
      };
      reader.onerror = () => {
        const objUrl = URL.createObjectURL(file);
        setCategoryImageFile(file);
        setCategoryImagePreview(objUrl);
      };
      reader.readAsDataURL(file);
    } catch {
      const objUrl = URL.createObjectURL(file);
      setCategoryImageFile(file);
      setCategoryImagePreview(objUrl);
    }
  };

  // ── Clear Image ─────────────────────────────────────────────────────────────
  const handleRemoveImage = () => {
    setCategoryImageFile(null);
    setCategoryImagePreview('');
    setCategoryImageError('');
    setUploadStatus('');
    setFormData(prev => ({ ...prev, image: '' }));
    if (categoryImageRef.current) categoryImageRef.current.value = '';
  };

  // ── Form Submit (upload → save) ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSavingCategory(true);
    setCategoryImageError('');
    setUploadStatus('');

    try {
      // Start with the URL field value only when no file has been selected
      let finalImageUrl = categoryImageFile ? '' : formData.image.trim();

      // If admin selected a new file → upload to Cloudinary via /api/upload
      if (categoryImageFile) {
        setUploadStatus('uploading');
        const fd = new FormData();
        fd.append('image', categoryImageFile);

        const uploadRes = await axios.post(`${apiBaseUrl}/upload`, fd, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthHeader().headers
          }
        });

        const uploaded = uploadRes.data?.imageUrl || uploadRes.data?.url || uploadRes.data?.path;
        if (!uploaded) throw new Error('Upload succeeded but no URL was returned.');
        finalImageUrl = uploaded;
        setUploadStatus('success');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: finalImageUrl,
        subcategories: formData.subcategories.split(',').map(s => s.trim()).filter(Boolean),
        isActive: formData.isActive
      };

      if (editingCategory) {
        await onEditCategory(editingCategory._id, payload);
      } else {
        await onAddCategory(payload);
      }

      handleCloseModal();
    } catch (err) {
      setUploadStatus('error');
      const msg = err.response?.data?.message || err.message || 'Failed to save category.';
      setCategoryImageError(msg);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const previewSrc = categoryImagePreview || formData.image;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight text-white flex items-center gap-2.5">
            <Tags className="w-6 h-6" />
            <span>Category &amp; Collection Management</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Structure your men's fashion catalog by apparel categories, fabric types, and subcategories.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* ── Categories Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            {/* Banner Image */}
            <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
              <img
                src={cat.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'}
                alt={cat.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-zinc-950/80 backdrop-blur-xs text-[10px] font-mono font-bold text-white border border-zinc-800">
                {cat.itemCount || 0} Products
              </div>

              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Collection</span>
                <h3 className="font-heading font-black text-white text-lg leading-tight">{cat.name}</h3>
              </div>
            </div>

            {/* Description & Subcategories */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {cat.description || 'Premium curated collection crafted for modern streetwear styling in Vijayawada.'}
                </p>

                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.subcategories.map((sub, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-medium border border-zinc-700">
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                  cat.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {cat.isActive ? 'Active' : 'Draft'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteCategory(cat._id, cat.name)}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD / EDIT CATEGORY MODAL ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl animate-in zoom-in-95">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-heading font-black text-white text-base">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {editingCategory ? 'Update details and replace the banner image.' : 'Upload a banner image and fill in the details.'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">

              {/* ── BANNER IMAGE UPLOAD WIDGET ─────────────────────────────── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Banner Image
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    JPG, PNG, WEBP · Max 5 MB
                  </span>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={categoryImageRef}
                  onChange={handleImageFileChange}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="category-image-input"
                />

                {previewSrc ? (
                  /* ── Image Preview State ───────────────────────────────── */
                  <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group aspect-video w-full">
                    <img
                      src={previewSrc}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                      }}
                    />

                    {/* Upload-status badge */}
                    {uploadStatus === 'uploading' && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-white text-[11px] font-bold">Uploading to Cloudinary…</span>
                      </div>
                    )}
                    {uploadStatus === 'success' && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-900/90 border border-emerald-600 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" />
                        Uploaded
                      </div>
                    )}

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => categoryImageRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-[11px] hover:bg-zinc-200 cursor-pointer shadow-md flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 cursor-pointer shadow-md flex items-center gap-1.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Clear
                      </button>
                    </div>

                    {/* File-selected indicator */}
                    {categoryImageFile && uploadStatus !== 'uploading' && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-zinc-950/90 border border-zinc-700 rounded-lg px-2 py-1">
                        <span className="text-zinc-300 text-[10px] font-medium truncate max-w-[70%]">
                          {categoryImageFile.name}
                        </span>
                        <span className="text-zinc-500 text-[10px] font-mono shrink-0">
                          {(categoryImageFile.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Empty / Drop-zone State ───────────────────────────── */
                  <div
                    onClick={() => categoryImageRef.current?.click()}
                    className="aspect-video w-full border-2 border-dashed border-zinc-700 hover:border-white rounded-2xl flex flex-col items-center justify-center p-5 text-center cursor-pointer bg-zinc-950/50 hover:bg-zinc-800/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center mb-2.5 transition-colors">
                      <Upload className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <span className="font-black text-white text-xs mb-0.5">Choose Banner Image</span>
                    <span className="text-[10px] text-zinc-500">Click to select from your device</span>
                    <span className="text-[10px] text-zinc-600 mt-1">JPG, PNG, WEBP · Max 5 MB</span>
                  </div>
                )}

                {/* Error message */}
                {categoryImageError && (
                  <div className="flex items-start gap-1.5 text-red-400 font-bold text-[10px] bg-red-950/30 border border-red-900/50 rounded-xl px-3 py-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{categoryImageError}</span>
                  </div>
                )}

                {/* Optional: paste URL fallback */}
                <div>
                  <label className="text-[10px] text-zinc-600 font-mono block mb-1">
                    — or paste an image URL directly —
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, image: val });
                      // Only update preview from URL field when no file is selected
                      if (!categoryImageFile) {
                        setCategoryImagePreview(val);
                      }
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-[11px] font-medium focus:outline-none focus:border-zinc-600 placeholder:text-zinc-700"
                  />
                </div>
              </div>

              {/* ── Category Name ──────────────────────────────────────────── */}
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Oversized T-Shirts"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                />
              </div>

              {/* ── Subcategories ──────────────────────────────────────────── */}
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Subcategories (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.subcategories}
                  onChange={(e) => setFormData({ ...formData, subcategories: e.target.value })}
                  placeholder="Heavyweight, Acid Wash, Raw Cotton"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white"
                />
              </div>

              {/* ── Description ────────────────────────────────────────────── */}
              <div>
                <label className="font-bold text-zinc-300 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description about fabric, silhouette, and style."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-medium focus:outline-none focus:border-white resize-none"
                />
              </div>

              {/* ── Active Toggle ───────────────────────────────────────────── */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div>
                  <p className="font-bold text-zinc-200 text-xs">Category Status</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {formData.isActive ? 'Visible on storefront' : 'Hidden from storefront (Draft)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    formData.isActive ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* ── Submit Row ──────────────────────────────────────────────── */}
              <div className="pt-1 flex gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSavingCategory}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="flex-1 py-2.5 rounded-xl bg-white text-zinc-950 font-black uppercase tracking-wider hover:bg-zinc-200 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {isSavingCategory ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>
                        {categoryImageFile && uploadStatus === 'uploading'
                          ? 'Uploading…'
                          : 'Saving…'}
                      </span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
