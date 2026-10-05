import { useMemo, useRef, useState } from 'react';
import type { Facility, Project } from '@/lib/types';
import { createPost, updatePost, RADIUS_PRESETS_KM, type PostInput } from '@/lib/admin';
import { facilityTypeLabel } from '@/lib/utils';
import { ImagePlus, Loader2, MapPin, Trash2 } from 'lucide-react';
import { ModalShell, FormError } from './DonationForm';
import { RadiusMap } from './RadiusMap';

interface PostFormModalProps {
  facilities: Facility[];
  /** Existing post to edit; omit to create a new one. */
  post?: Project | null;
  onClose: () => void;
  onSaved: (post: Project) => void;
}

const MAX_PHOTO_EDGE = 1600;
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100';

/** Downscale a photo in the browser so phone pictures stay well under the 3 MB upload limit. */
async function readPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Photo must be a JPEG, PNG or WebP image.');
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read this image.'));
      el.src = url;
    });
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PostFormModal({ facilities, post, onClose, onSaved }: PostFormModalProps) {
  const editing = Boolean(post);
  const [facilityId, setFacilityId] = useState(post?.facility_id ?? facilities[0]?.id ?? '');
  const [title, setTitle] = useState(post?.title ?? '');
  const [description, setDescription] = useState(post?.description ?? '');
  const [target, setTarget] = useState(post ? String(post.target_amount) : '');
  const [radiusKm, setRadiusKm] = useState<number | null>(post ? post.service_radius_km ?? null : 5);
  const [status, setStatus] = useState<Project['status']>(post?.status ?? 'active');
  const [photo, setPhoto] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const facility = useMemo(() => facilities.find((f) => f.id === facilityId) ?? null, [facilities, facilityId]);
  const previewUrl = photo ?? (!removePhoto ? post?.image_url ?? null : null);

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      setPhoto(await readPhoto(file));
      setRemovePhoto(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this image.');
    }
  };

  const handleSubmit = async () => {
    const amount = parseFloat(target);
    if (!facility) return setError('Choose a facility.');
    if (title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter a goal amount greater than 0.');
    if (radiusKm !== null && !(radiusKm > 0 && radiusKm <= 500)) return setError('Radius must be between 1 and 500 km.');

    const input: PostInput = {
      facility_id: facility.id,
      title: title.trim(),
      description: description.trim(),
      target_amount: amount,
      service_radius_km: radiusKm,
      status,
      ...(photo ? { image_data: photo } : {}),
      ...(removePhoto ? { remove_image: true } : {}),
    };

    setSaving(true);
    setError('');
    try {
      onSaved(editing && post ? await updatePost(post.id, input) : await createPost(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this post.');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <>
      <h2 className="text-base font-bold text-slate-800">{editing ? 'Edit water post' : 'New water post'}</h2>
      <p className="text-xs text-slate-500">Donors inside the service area will see this post.</p>
    </>
  );

  return (
    <ModalShell onClose={onClose} header={header}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6 pt-3">
        <Field label="Facility">
          {facilities.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No verified facilities yet. Verify one in the Facilities tab first.
            </p>
          ) : (
            <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className={inputClass}>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} · {facilityTypeLabel(f.type)} · {f.area ?? f.governorate}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Drinking water cooler for Friday prayers"
            className={inputClass}
          />
        </Field>

        <Field label="Description" hint="optional">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What is needed, who it helps, and how the money will be used."
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label="Goal amount">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">OMR</span>
            <input
              type="number"
              min="0"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="500"
              className={`${inputClass} pl-12`}
            />
          </div>
        </Field>

        <Field label="Photo" hint="optional">
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              <img src={previewUrl} alt="" className="h-40 w-full object-cover" />
              <div className="absolute right-2 top-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setRemovePhoto(Boolean(post?.image_url));
                  }}
                  aria-label="Remove photo"
                  className="rounded-lg bg-white/90 p-1.5 text-red-600 hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 transition-colors hover:border-teal-400 hover:bg-teal-50/40 hover:text-teal-700"
            >
              <ImagePlus className="h-5 w-5" />
              Upload a photo (JPEG, PNG or WebP)
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              handlePhoto(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </Field>

        <Field label="Service area">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {RADIUS_PRESETS_KM.map((km) => (
              <Chip key={km} active={radiusKm === km} onClick={() => setRadiusKm(km)}>
                {km} km
              </Chip>
            ))}
            <Chip active={radiusKm === null} onClick={() => setRadiusKm(null)}>
              All of Oman
            </Chip>
          </div>
          {radiusKm !== null && (
            <div className="mb-2 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={100}
                value={Math.min(radiusKm, 100)}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="flex-1 accent-teal-600"
                aria-label="Service radius in km"
              />
              <span className="w-14 text-right text-sm font-semibold tabular-nums text-slate-700">{radiusKm} km</span>
            </div>
          )}
          {facility && (
            <div className="h-48 overflow-hidden rounded-xl border border-slate-200">
              <RadiusMap lat={facility.lat} lng={facility.lng} radiusKm={radiusKm} label={facility.name} />
            </div>
          )}
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3" />
            {radiusKm === null
              ? 'Visible to donors anywhere in Oman.'
              : `Visible to donors within ${radiusKm} km of ${facility?.name ?? 'the facility'} when they use Near Me.`}
          </p>
        </Field>

        {editing && (
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as Project['status'])} className={inputClass}>
              <option value="active">Active (visible to donors)</option>
              <option value="funded">Funded</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
        )}

        <FormError message={error} />
        <button
          onClick={handleSubmit}
          disabled={saving || facilities.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Publish post'}
        </button>
      </div>
    </ModalShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label} {hint && <span className="font-normal text-slate-400">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
