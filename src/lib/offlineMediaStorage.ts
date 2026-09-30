import { db } from './db';
import { OfflineMediaEvidence } from '@/types';

/**
 * Saves a photo/media file locally in IndexedDB for full offline operations.
 */
export const saveOfflineMediaEvidence = async (
  item: Omit<OfflineMediaEvidence, 'id' | 'isSynced' | 'createdAt'>
): Promise<OfflineMediaEvidence> => {
  const newEvidence: OfflineMediaEvidence = {
    ...item,
    id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    isSynced: false,
    createdAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined') {
      await db.media_evidence.put(newEvidence);
      window.dispatchEvent(new CustomEvent('egyptian_school_media_update', { detail: newEvidence }));
    }
  } catch (error) {
    console.error('Failed to save offline media evidence to IndexedDB:', error);
  }

  return newEvidence;
};

/**
 * Gets media evidence records filtered by student, class, department, or category.
 */
export const getOfflineMediaEvidence = async (filter?: {
  studentId?: string;
  classId?: string;
  departmentId?: string;
  category?: OfflineMediaEvidence['category'];
}): Promise<OfflineMediaEvidence[]> => {
  if (typeof window === 'undefined') return [];

  try {
    let collection = db.media_evidence.toCollection();

    const all = await collection.toArray();
    return all.filter((item) => {
      if (filter?.studentId && item.studentId !== filter.studentId) return false;
      if (filter?.classId && item.classId !== filter.classId) return false;
      if (filter?.departmentId && item.departmentId !== filter.departmentId) return false;
      if (filter?.category && item.category !== filter.category) return false;
      return true;
    });
  } catch (error) {
    console.error('Failed to query media evidence from IndexedDB:', error);
    return [];
  }
};

/**
 * Deletes an offline media evidence item.
 */
export const deleteOfflineMediaEvidence = async (id: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  try {
    await db.media_evidence.delete(id);
    window.dispatchEvent(new CustomEvent('egyptian_school_media_update', { detail: { id, deleted: true } }));
    return true;
  } catch (error) {
    console.error('Failed to delete media evidence from IndexedDB:', error);
    return false;
  }
};

/**
 * Helper to convert a File or Blob into a Base64 dataUrl for offline storage.
 */
export const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
