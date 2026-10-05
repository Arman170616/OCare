import { getLang } from './i18n';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

// Arabic versions of the backend's user-facing error messages.
const ERRORS_AR: Record<string, string> = {
  'Facility not found': 'المنشأة غير موجودة',
  'Facility must be verified before posting': 'يجب توثيق المنشأة قبل النشر',
  'Photo must be JPEG, PNG or WebP': 'يجب أن تكون الصورة بصيغة JPEG أو PNG أو WebP',
  'Photo must be 3 MB or smaller': 'يجب ألا يتجاوز حجم الصورة 3 ميغابايت',
  'Invalid image data': 'بيانات الصورة غير صالحة',
  'Post not found': 'المنشور غير موجود',
  'Project not found': 'المشروع غير موجود',
  'This post has donations. Close it instead of deleting.': 'يحتوي هذا المنشور على تبرعات. أغلقه بدلًا من حذفه.',
  'Invalid status': 'حالة غير صالحة',
  'Donation amount is required': 'مبلغ التبرع مطلوب',
  'Donation amount must be greater than zero': 'يجب أن يكون مبلغ التبرع أكبر من صفر',
  'Failed to fetch': 'تعذر الاتصال بالخادم',
};

function localizeError(message: string): string {
  return getLang() === 'ar' ? ERRORS_AR[message] ?? message : message;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resolvedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${resolvedPath}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    throw new Error(localizeError(err instanceof Error ? err.message : 'Failed to fetch'));
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text || response.statusText || 'Request failed';

    try {
      const json = JSON.parse(text);
      if (typeof json?.detail === 'string') {
        message = json.detail;
      } else if (Array.isArray(json?.detail)) {
        const first = json.detail[0];
        if (first && typeof first === 'object') {
          message = first.msg || first.message || 'Validation failed';
        }
      }
    } catch {
      // ignore malformed JSON error payloads;
    }

    throw new Error(localizeError(message));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiBaseUrl = API_BASE_URL;
