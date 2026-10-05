import { useMemo, useRef, useState } from 'react';
import type { Facility, Project } from '@/lib/types';
import { createPost, updatePost, RADIUS_PRESETS_KM, type PostInput } from '@/lib/admin';
import { facilityTypeLabel, facilityName, placeName } from '@/lib/utils';
import { tr } from '@/lib/i18n';
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
    throw new Error(tr('Photo must be a JPEG, PNG or WebP image.', 'يجب أن تكون الصورة بصيغة JPEG أو PNG أو WebP.'));
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(tr('Could not read this image.', 'تعذرت قراءة هذه الصورة.')));
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
      setError(err instanceof Error ? err.message : tr('Could not read this image.', 'تعذرت قراءة هذه الصورة.'));
    }
  };

  const handleSubmit = async () => {
    const amount = parseFloat(target);
    if (!facility) return setError(tr('Choose a facility.', 'اختر منشأة.'));
    if (title.trim().length < 3) return setError(tr('Title must be at least 3 characters.', 'يجب أن يتكون العنوان من 3 أحرف على الأقل.'));
    if (!Number.isFinite(amount) || amount <= 0) return setError(tr('Enter a goal amount greater than 0.', 'أدخل مبلغًا مستهدفًا أكبر من 0.'));
    if (radiusKm !== null && !(radiusKm > 0 && radiusKm <= 500)) return setError(tr('Radius must be between 1 and 500 km.', 'يجب أن يكون النطاق بين 1 و500 كم.'));

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
      setError(err instanceof Error ? err.message : tr('Could not save this post.', 'تعذر حفظ هذا المنشور.'));
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <>
      <h2 className="text-base font-bold text-slate-800">{editing ? tr('Edit water post', 'تعديل منشور المياه') : tr('New water post', 'منشور مياه جديد')}</h2>
      <p className="text-xs text-slate-500">{tr('Donors inside the service area will see this post.', 'سيرى هذا المنشور المتبرعون داخل نطاق الخدمة.')}</p>
    </>
  );

  return (
    <ModalShell onClose={onClose} header={header}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6 pt-3">
        <Field label={tr('Facility', 'المنشأة')}>
          {facilities.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {tr('No verified facilities yet. Verify one in the Facilities tab first.', 'لا توجد منشآت موثقة بعد. وثّق منشأة من تبويب المنشآت أولًا.')}
            </p>
          ) : (
            <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} className={inputClass}>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {facilityName(f)} · {facilityTypeLabel(f.type)} · {placeName(f.area ?? f.governorate)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={tr('Title', 'العنوان')}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder={tr('e.g. Drinking water cooler for Friday prayers', 'مثال: برّادة مياه شرب لصلاة الجمعة')}
            className={inputClass}
          />
        </Field>

        <Field label={tr('Description', 'الوصف')} hint={tr('optional', 'اختياري')}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={tr('What is needed, who it helps, and how the money will be used.', 'ما المطلوب، ومن المستفيد، وكيف ستُستخدم الأموال.')}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <Field label={tr('Goal amount', 'المبلغ المستهدف')}>
          <div className="relative">
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">{tr('OMR', 'ر.ع.')}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="500"
              className={`${inputClass} ps-12`}
            />
          </div>
        </Field>

        <Field label={tr('Photo', 'الصورة')} hint={tr('optional', 'اختياري')}>
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              <img src={previewUrl} alt="" className="h-40 w-full object-cover" />
              <div className="absolute end-2 top-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  {tr('Replace', 'استبدال')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setRemovePhoto(Boolean(post?.image_url));
                  }}
                  aria-label={tr('Remove photo', 'إزالة الصورة')}
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
              {tr('Upload a photo (JPEG, PNG or WebP)', 'ارفع صورة (JPEG أو PNG أو WebP)')}
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

        <Field label={tr('Service area', 'نطاق الخدمة')}>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {RADIUS_PRESETS_KM.map((km) => (
              <Chip key={km} active={radiusKm === km} onClick={() => setRadiusKm(km)}>
                {tr(`${km} km`, `${km} كم`)}
              </Chip>
            ))}
            <Chip active={radiusKm === null} onClick={() => setRadiusKm(null)}>
              {tr('All of Oman', 'كل عُمان')}
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
                aria-label={tr('Service radius in km', 'نطاق الخدمة بالكيلومتر')}
              />
              <span className="w-14 text-end text-sm font-semibold tabular-nums text-slate-700">{tr(`${radiusKm} km`, `${radiusKm} كم`)}</span>
            </div>
          )}
          {facility && (
            <div className="h-48 overflow-hidden rounded-xl border border-slate-200">
              <RadiusMap lat={facility.lat} lng={facility.lng} radiusKm={radiusKm} label={facilityName(facility)} />
            </div>
          )}
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3" />
            {radiusKm === null
              ? tr('Visible to donors anywhere in Oman.', 'يظهر للمتبرعين في أي مكان في عُمان.')
              : tr(
                  `Visible to donors within ${radiusKm} km of ${facility?.name ?? 'the facility'} when they use Near Me.`,
                  `يظهر للمتبرعين ضمن ${radiusKm} كم من ${facility ? facilityName(facility) : 'المنشأة'} عند استخدام «بالقرب مني».`
                )}
          </p>
        </Field>

        {editing && (
          <Field label={tr('Status', 'الحالة')}>
            <select value={status} onChange={(e) => setStatus(e.target.value as Project['status'])} className={inputClass}>
              <option value="active">{tr('Active (visible to donors)', 'نشط (ظاهر للمتبرعين)')}</option>
              <option value="funded">{tr('Funded', 'مكتمل التمويل')}</option>
              <option value="completed">{tr('Completed', 'منتهٍ')}</option>
              <option value="cancelled">{tr('Cancelled', 'ملغى')}</option>
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
          {saving ? tr('Saving...', 'جارٍ الحفظ...') : editing ? tr('Save changes', 'حفظ التغييرات') : tr('Publish post', 'نشر المنشور')}
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
