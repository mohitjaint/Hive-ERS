import { useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { inventoryApi, transactionsApi, storageApi } from '../lib/api';
import { useIsManager, useIsCoordinator } from '../lib/MemberContext';
import {
  Search, Plus, X, Loader2, Package, Edit2, Trash2, ShieldAlert,
  ChevronDown, Upload, AlertCircle
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function StatusBadge({ item }) {
  if (!item.policy?.allowedToTake) return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-red-900/30 text-red-400 border-red-800/40">RESTRICTED</span>
  );
  if (item.availableQuantity === 0) return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-gray-800 text-gray-500 border-gray-700">OUT OF STOCK</span>
  );
  if (item.availableQuantity <= 3) return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-amber-900/30 text-amber-400 border-amber-800/40">LIMITED</span>
  );
  return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-emerald-900/30 text-emerald-400 border-emerald-800/40">AVAILABLE</span>
  );
}

/* ─── Image crop helpers ─────────────────────────────────────────────────── */
const IMAGE_CROP_ASPECT = 16 / 9;

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened. Please choose another image.'));
    image.src = source;
  });
}

async function createCroppedImage(file, source, cropArea) {
  const image = await loadImage(source);
  const validCrop = cropArea
    && Number.isFinite(cropArea.x)
    && Number.isFinite(cropArea.y)
    && Number.isFinite(cropArea.width)
    && Number.isFinite(cropArea.height)
    && cropArea.width > 0
    && cropArea.height > 0;
  const fallbackHeight = image.naturalHeight || image.height;
  const fallbackWidth = Math.min(image.naturalWidth || image.width, fallbackHeight * IMAGE_CROP_ASPECT);
  const fallbackCrop = {
    x: Math.max(0, Math.round(((image.naturalWidth || image.width) - fallbackWidth) / 2)),
    y: Math.max(0, Math.round((fallbackHeight - (fallbackWidth / IMAGE_CROP_ASPECT)) / 2)),
    width: Math.max(1, Math.round(fallbackWidth)),
    height: Math.max(1, Math.round(fallbackWidth / IMAGE_CROP_ASPECT)),
  };
  const area = validCrop ? cropArea : fallbackCrop;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the image crop. Please try another image.');
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const filename = `${file.name.replace(/\.[^/.]+$/, '') || 'inventory-image'}-16x9.${extension}`;
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Unable to crop this image. Please choose another image.'));
    }, mimeType, 0.92);
  });

  return new File([blob], filename, { type: mimeType });
}

function ImageCropModal({ file, onApply, onClose }) {
  const [source, setSource] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const reader = new FileReader();

    reader.onload = () => {
      if (active && typeof reader.result === 'string') setSource(reader.result);
    };
    reader.onerror = () => {
      if (active) setError('This image could not be read. Please choose another JPEG or PNG image.');
    };
    reader.readAsDataURL(file);

    return () => {
      active = false;
      reader.abort();
    };
  }, [file]);

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError('');
  };

  const apply = async () => {
    if (!cropArea) return;
    setSaving(true);
    setError('');
    try {
      onApply(await createCroppedImage(file, source, cropArea));
    } catch (cropError) {
      setError(cropError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="crop-image-title">
      <div className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 p-4 sm:p-5">
          <div>
            <h3 id="crop-image-title" className="text-lg font-bold text-heading">Adjust Image</h3>
            <p className="mt-0.5 text-xs text-gray-500">Position and zoom your image in the 16:9 card frame.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-md p-1 text-gray-500 transition-colors hover:text-gray-300 disabled:opacity-50" aria-label="Close image editor"><X size={20} /></button>
        </div>
        <div className="p-4 sm:p-5">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            {source ? <Cropper
              image={source}
              crop={crop}
              zoom={zoom}
              aspect={IMAGE_CROP_ASPECT}
              cropShape="rect"
              showGrid={false}
              disableAutomaticStylesInjection
              roundCropAreaPixels
              style={{
                containerStyle: { position: 'absolute', inset: 0 },
                mediaStyle: { maxWidth: 'none' },
              }}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCropArea(pixels.width > 0 && pixels.height > 0 ? pixels : null)}
              onMediaLoaded={() => setMediaReady(true)}
              mediaProps={{ onError: () => setError('The image could not be loaded. Please choose another image.') }}
            /> : <div className="flex h-full items-center justify-center text-sm text-gray-400"><Loader2 size={20} className="mr-2 animate-spin" />Preparing image…</div>}
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <label htmlFor="image-crop-zoom">Zoom</label>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input id="image-crop-zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-gold" />
          </div>
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex flex-col gap-2 border-t border-gray-800 p-4 sm:flex-row sm:p-5">
          <button type="button" onClick={onClose} disabled={saving} className="h-11 rounded-lg border border-gray-700 px-4 text-sm text-gray-400 transition-colors hover:border-gray-500 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={reset} disabled={saving} className="h-11 rounded-lg border border-gray-700 px-4 text-sm text-gray-300 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-50">Reset</button>
          <button type="button" onClick={apply} disabled={saving || !mediaReady || !cropArea} className="h-11 rounded-lg bg-gold px-5 text-sm font-bold text-black transition-colors hover:bg-gold/90 disabled:opacity-60 sm:ml-auto">
            {saving ? 'Applying…' : 'Apply Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Borrow Modal ─────────────────────────────────────────────────────────── */
function BorrowModal({ item, onClose, onSuccess }) {
  const [qty, setQty] = useState(1);
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const maxQty = item.policy?.maxQuantityPerMember
    ? Math.min(item.availableQuantity, item.policy.maxQuantityPerMember)
    : item.availableQuantity;

  const submit = async () => {
    if (!item.isConsumable && !returnDate) return setError('Please select a return date');
    setLoading(true); setError('');
    try {
      const payload = { items: [{ item: item._id, quantity: qty }] };
      if (!item.isConsumable) payload.expectedReturnDate = returnDate;
      await transactionsApi.request(payload);
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-heading font-bold text-lg">Borrow Item</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-gray-800">
            {item.image
              ? <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
              : <div className="h-14 w-14 rounded-lg bg-gray-800 flex items-center justify-center"><Package size={20} className="text-gray-600" /></div>}
            <div>
              <p className="text-heading font-semibold">{item.name}</p>
              <p className="text-gray-500 text-xs">{item.category} · {item.availableQuantity} available</p>
              {item.policy?.maxDurationDays && (
                <p className="text-amber-400 text-xs mt-0.5">Max {item.policy.maxDurationDays} day(s)</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Quantity (max {maxQty})</label>
            <input type="number" min={1} max={maxQty} value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
              className="w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold" />
          </div>
          {!item.isConsumable && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Expected Return Date</label>
              <input type="date" min={minDateStr} value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold" />
            </div>
          )}
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Item Form Modal (add / edit) ─────────────────────────────────────────── */
function ItemFormModal({ item, onClose, onSuccess }) {
  const isEdit = !!item;
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || '',
    isConsumable: item?.isConsumable ?? false,
    isCollegeFunded: item?.isCollegeFunded ?? true,
    fundingSourceNote: item?.fundingSourceNote || '',
    totalQuantity: item?.totalQuantity ?? '',
    availableQuantity: item?.availableQuantity ?? '',
    damagedQuantity: item?.damagedQuantity ?? 0,
    storageId: item?.storageId?._id || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [originalImageFile, setOriginalImageFile] = useState(null);
  const [preview, setPreview] = useState(item?.image || null);
  const [cropImageFile, setCropImageFile] = useState(null);
  const previewUrlRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storages, setStorages] = useState([]);

  const canResetImage = useMemo(() => Boolean(imageFile || (!imageFile && preview && preview !== item?.image)), [imageFile, preview, item?.image]);

  useEffect(() => {
    storageApi.getAll().then(res => setStorages(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const replacePreview = (file) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = URL.createObjectURL(file);
    setPreview(previewUrlRef.current);
  };

  const pickImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setOriginalImageFile(f);
    setCropImageFile(f);
    e.target.value = '';
  };

  const applyCrop = (croppedFile) => {
    setImageFile(croppedFile);
    replacePreview(croppedFile);
    setCropImageFile(null);
  };

  const openCameraPicker = () => {
    cameraInputRef.current?.click();
  };

  const openGalleryPicker = () => {
    galleryInputRef.current?.click();
  };

  const resetImageSelection = () => {
    setImageFile(null);
    setOriginalImageFile(null);
    setCropImageFile(null);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(item?.image || null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const submit = async () => {
    if (!form.name || !form.description || !form.category || form.totalQuantity === '') {
      return setError('All fields are required');
    }
    if (!isEdit && !imageFile) return setError('Image is required');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (isEdit) {
        await inventoryApi.update(item._id, fd);
      } else {
        await inventoryApi.create(fd);
      }
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {cropImageFile && <ImageCropModal file={cropImageFile} onApply={applyCrop} onClose={() => setCropImageFile(null)} />}
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0">
          <h3 className="text-heading font-bold text-lg">{isEdit ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Image upload */}
          <div className="space-y-3">
            <div className="aspect-video rounded-xl border-2 border-dashed border-gray-700 hover:border-gold/50 transition-colors flex items-center justify-center overflow-hidden bg-bg">
              {preview
                ? <img src={preview} alt="preview" className="h-full w-full object-cover rounded-xl" />
                : <div className="flex flex-col items-center gap-2 text-gray-600 text-center px-4"><Upload size={28} /><span className="text-xs">Take a photo or choose from gallery</span></div>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openCameraPicker}
                className="h-11 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <Upload size={16} />
                Take Photo
              </button>
              <button
                type="button"
                onClick={openGalleryPicker}
                className="h-11 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gold/50 hover:text-gold transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <Upload size={16} />
                Choose from Gallery
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500">
              <span>Mobile browsers can open the camera directly.</span>
              <div className="flex items-center gap-3">
                {originalImageFile && <button type="button" onClick={() => setCropImageFile(originalImageFile)} className="text-gold hover:text-gold/80 transition-colors">Adjust crop</button>}
                {canResetImage && <button type="button" onClick={resetImageSelection} className="text-gold hover:text-gold/80 transition-colors">Remove photo</button>}
              </div>
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickImage} />
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Name</label><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Category</label><input className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} /></div>
          </div>
          <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-gray-800">
            <div>
              <p className="text-heading text-sm font-medium">Consumable Item</p>
              <p className="text-gray-500 text-[10px]">Item is given permanently, not returned</p>
            </div>
            <button type="button" onClick={() => set('isConsumable', !form.isConsumable)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.isConsumable ? 'bg-gold' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isConsumable ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Funding Source Toggle */}
          <div className="p-3 bg-bg rounded-xl border border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-heading text-sm font-medium">Funding Source</p>
                <p className="text-gray-500 text-[10px]">College funds vs alumni donation / member contribution</p>
              </div>
              <div className="flex bg-surface p-1 rounded-lg border border-gray-800 text-xs">
                <button
                  type="button"
                  onClick={() => set('isCollegeFunded', true)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${form.isCollegeFunded ? 'bg-gold text-black font-semibold' : 'text-gray-400 hover:text-heading'}`}
                >
                  College
                </button>
                <button
                  type="button"
                  onClick={() => set('isCollegeFunded', false)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${!form.isCollegeFunded ? 'bg-purple-600 text-white font-semibold' : 'text-gray-400 hover:text-heading'}`}
                >
                  Donated / Contributed
                </button>
              </div>
            </div>
            {!form.isCollegeFunded && (
              <div className="pt-2 border-t border-gray-800">
                <label className="text-xs text-purple-300 block mb-1">Donor / Contribution Notes</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Donated by Alumni Class of '22, Contributed by Alex & Sam"
                  value={form.fundingSourceNote}
                  onChange={(e) => set('fundingSourceNote', e.target.value)}
                />
              </div>
            )}
          </div>

          <div><label className="text-xs text-gray-400 block mb-1">Description</label><textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Total Qty</label><input type="number" className={inputCls} value={form.totalQuantity} onChange={(e) => set('totalQuantity', e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Available</label><input type="number" className={inputCls} value={form.availableQuantity} onChange={(e) => set('availableQuantity', e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Damaged</label><input type="number" className={inputCls} value={form.damagedQuantity} onChange={(e) => set('damagedQuantity', e.target.value)} /></div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Storage Box</label>
            <select className={inputCls} value={form.storageId} onChange={(e) => set('storageId', e.target.value)}>
              <option value="">No Storage Assigned</option>
              {storages.map(s => (
                <option key={s._id} value={s._id}>
                  Box #{s.storageNumber} {s.name ? `- ${s.name}` : ''}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 p-5 border-t border-gray-800 shrink-0">
          <button onClick={onClose} className="w-full min-h-14 sm:min-h-12 sm:flex-1 rounded-lg border border-gray-700 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-heading transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="w-full min-h-14 sm:min-h-12 sm:flex-1 rounded-lg bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Policy Modal ─────────────────────────────────────────────────────────── */
function PolicyModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    allowedToTake: item?.policy?.allowedToTake ?? true,
    maxQuantityPerMember: item?.policy?.maxQuantityPerMember ?? '',
    maxDurationDays: item?.policy?.maxDurationDays ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await inventoryApi.setPolicy(item._id, {
        allowedToTake: form.allowedToTake,
        maxQuantityPerMember: form.maxQuantityPerMember === '' ? null : Number(form.maxQuantityPerMember),
        maxDurationDays: form.maxDurationDays === '' ? null : Number(form.maxDurationDays),
      });
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-heading font-bold text-lg">Set Policy</h3>
            <p className="text-gray-500 text-xs mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-gray-800">
            <div>
              <p className="text-heading text-sm font-medium">Allow Borrowing</p>
              <p className="text-gray-500 text-xs">Members can request this item</p>
            </div>
            <button onClick={() => setForm((f) => ({ ...f, allowedToTake: !f.allowedToTake }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.allowedToTake ? 'bg-gold' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.allowedToTake ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Max Quantity Per Member <span className="text-gray-600">(leave blank = no limit)</span></label>
            <input type="number" min={1} className={inputCls} value={form.maxQuantityPerMember}
              onChange={(e) => setForm((f) => ({ ...f, maxQuantityPerMember: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Max Borrow Duration (days) <span className="text-gray-600">(leave blank = no limit)</span></label>
            <input type="number" min={1} className={inputCls} value={form.maxDurationDays}
              onChange={(e) => setForm((f) => ({ ...f, maxDurationDays: e.target.value }))} />
          </div>
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Item Card ─────────────────────────────────────────────────────────────── */
function ItemCard({ item, isManager, isCoordinator, onBorrow, onEdit, onDelete, onPolicy }) {
  const canBorrow = item.policy?.allowedToTake && item.availableQuantity > 0;

  return (
    <div className="flex flex-col rounded-xl border border-gray-800 bg-surface hover:border-gold/30 transition-colors group">
      <div className="aspect-video rounded-t-xl overflow-hidden bg-gray-900 border-b border-gray-800">
        {item.image
          ? <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="h-full flex items-center justify-center"><Package size={40} className="text-gray-700" /></div>}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-heading font-semibold text-sm truncate flex items-center gap-1.5 flex-wrap">
              <span>{item.name}</span>
              {item.isConsumable && <span className="bg-blue-900/40 text-blue-400 border border-blue-800/40 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">CONSUMABLE</span>}
              {item.isCollegeFunded === false ? (
                <span className="bg-purple-900/40 text-purple-300 border border-purple-800/40 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">DONATED / CONTRIBUTED</span>
              ) : (
                <span className="bg-amber-900/20 text-amber-400/80 border border-amber-800/30 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">COLLEGE FUNDED</span>
              )}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5 truncate">{item.category}</p>
          </div>
          <StatusBadge item={item} />
        </div>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>
        
        {item.isCollegeFunded === false && item.fundingSourceNote && (
          <div className="text-[11px] text-purple-300 bg-purple-950/40 px-2 py-1.5 rounded-lg border border-purple-900/40 flex items-center gap-1.5">
            <span className="font-semibold text-purple-400 shrink-0">Source:</span>
            <span className="truncate">{item.fundingSourceNote}</span>
          </div>
        )}

        {item.storageId && (
          <div className="text-[11px] text-gray-400 bg-gray-800/50 px-2 py-1.5 rounded-lg border border-gray-800 flex items-center gap-1.5">
            <Package size={12} className="text-gold" />
            <span>Box #{item.storageId.storageNumber}{item.storageId.name ? ` - ${item.storageId.name}` : ''}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-t border-gray-800 pt-2">
          <span>Available: <span className="text-heading">{item.availableQuantity}</span></span>
          <span>Total: {item.totalQuantity}</span>
        </div>
        {/* Policy info */}
        {(item.policy?.maxQuantityPerMember || item.policy?.maxDurationDays) && (
          <div className="text-[10px] text-amber-500/80 bg-amber-900/10 rounded-lg px-2 py-1.5 border border-amber-900/20 space-y-0.5">
            {item.policy.maxQuantityPerMember && <p>Limit: {item.policy.maxQuantityPerMember} per member</p>}
            {item.policy.maxDurationDays && <p>Max: {item.policy.maxDurationDays} day(s)</p>}
          </div>
        )}
        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {isManager && (
            <>
              <button onClick={() => onEdit(item)} className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-gold/50 hover:text-gold transition-colors"><Edit2 size={13} /></button>
              <button onClick={() => onDelete(item)} className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-red-500/50 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </>
          )}
          {isCoordinator && (
            <button onClick={() => onPolicy(item)} className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-gold/50 hover:text-gold transition-colors" title="Set Policy"><ShieldAlert size={13} /></button>
          )}
          <button onClick={() => canBorrow && onBorrow(item)} disabled={!canBorrow}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-xs hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {canBorrow ? 'Borrow' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const isManager = useIsManager();
  const isCoordinator = useIsCoordinator();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [fundingFilter, setFundingFilter] = useState('');
  const [borrowItem, setBorrowItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [policyItem, setPolicyItem] = useState(null);
  const [toast, setToast] = useState('');

  const fetchItems = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (fundingFilter) params.isCollegeFunded = fundingFilter;
    inventoryApi.getAll(params)
      .then((res) => { setItems(res.data || []); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!active) return;
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (fundingFilter) params.isCollegeFunded = fundingFilter;

      try {
        const res = await inventoryApi.getAll(params);
        if (active) {
          setItems(res.data || []);
          setError('');
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [search, category, fundingFilter]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await inventoryApi.delete(item._id);
      showToast('Item deleted');
      fetchItems();
    } catch (e) { alert(e.message); }
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <div className="w-full min-h-screen bg-bg text-fg px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6 overflow-x-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-900/80 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Modals */}
      {borrowItem && (
        <BorrowModal item={borrowItem} onClose={() => setBorrowItem(null)}
          onSuccess={() => { setBorrowItem(null); showToast('Request submitted!'); }} />
      )}
      {(showAddForm || editItem) && (
        <ItemFormModal item={editItem || null} onClose={() => { setEditItem(null); setShowAddForm(false); }}
          onSuccess={() => { setEditItem(null); setShowAddForm(false); showToast(editItem ? 'Item updated!' : 'Item added!'); fetchItems(); }} />
      )}
      {policyItem && (
        <PolicyModal item={policyItem} onClose={() => setPolicyItem(null)}
          onSuccess={() => { setPolicyItem(null); showToast('Policy updated!'); fetchItems(); }} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">Browse and borrow items</p>
        </div>
        {isManager && (
          <button onClick={() => setShowAddForm(true)}
            className="inline-flex h-11 items-center gap-2 px-4 bg-gold text-black font-bold text-sm rounded-lg hover:bg-gold/90 transition-colors self-start sm:self-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
            <Plus size={16} /> Add Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 min-w-0">
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-surface border border-gray-800 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-500 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="flex-1 bg-transparent text-sm text-heading placeholder:text-gray-600 focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-gray-600 hover:text-gray-400"><X size={14} /></button>}
        </div>
        {categories.length > 0 && (
          <div className="relative">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="appearance-none w-full sm:w-auto bg-surface border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-heading focus:outline-none focus:border-gold">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        )}
        <div className="relative">
            <select value={fundingFilter} onChange={(e) => setFundingFilter(e.target.value)}
            className="appearance-none w-full sm:w-auto bg-surface border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-heading focus:outline-none focus:border-gold">
            <option value="">All Funding Sources</option>
            <option value="true">College Funded</option>
            <option value="false">Donated / Contributed</option>
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Error */}
      {error && <div className="text-red-400 text-sm border border-red-800/40 bg-red-900/10 rounded-xl px-4 py-3">{error}</div>}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 size={24} className="animate-spin mr-2" /><span className="text-sm">Loading inventory...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <Package size={40} className="text-gray-800" />
          <p className="text-sm">No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
          {items.map((item) => (
            <ItemCard key={item._id} item={item}
              isManager={isManager} isCoordinator={isCoordinator}
              onBorrow={setBorrowItem} onEdit={setEditItem}
              onDelete={handleDelete} onPolicy={setPolicyItem} />
          ))}
        </div>
      )}
    </div>
  );
}
