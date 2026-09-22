import { CreatorQuestionAnswers } from './types';

export const SOP_DRAFT_STORAGE_KEY = 'ffi_sop_questionnaire_draft_v1';

export interface QuestionnaireDraftPayload {
  answers: CreatorQuestionAnswers;
  step: number;
  timestamp: string; // ISO string
  sopId?: string;
  sopNumber?: string;
  backendSynced?: boolean;
}

export interface SaveDraftResult {
  payload: QuestionnaireDraftPayload;
  backendSuccess: boolean;
  message: string;
}

/**
 * Save draft locally to localStorage as immediate safeguard
 */
export function saveDraftLocally(
  answers: CreatorQuestionAnswers,
  step: number = 1,
  sopId?: string,
  sopNumber?: string,
  backendSynced: boolean = false
): QuestionnaireDraftPayload {
  const payload: QuestionnaireDraftPayload = {
    answers,
    step,
    timestamp: new Date().toISOString(),
    sopId,
    sopNumber,
    backendSynced
  };
  try {
    localStorage.setItem(SOP_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save SOP draft to localStorage:', err);
  }
  return payload;
}

/**
 * Load draft locally from localStorage
 */
export function loadDraftLocally(): QuestionnaireDraftPayload | null {
  try {
    const raw = localStorage.getItem(SOP_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.answers) {
      return parsed as QuestionnaireDraftPayload;
    }
  } catch (err) {
    console.warn('Failed to parse SOP draft from localStorage:', err);
  }
  return null;
}

/**
 * Clear draft locally from localStorage
 */
export function clearDraftLocally(): void {
  try {
    localStorage.removeItem(SOP_DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear SOP draft from localStorage:', err);
  }
}

/**
 * Save draft using the backend API, with automatic local fallback if unavailable
 */
export async function saveDraftWithBackend(
  answers: CreatorQuestionAnswers,
  step: number = 1,
  userEmail?: string,
  sopId?: string,
  sopNumber?: string
): Promise<SaveDraftResult> {
  const draftKey = userEmail ? `draft_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : 'default_user_draft';
  const timestamp = new Date().toISOString();

  // 1. Always save locally first so user data is never lost even if network crashes
  let localPayload = saveDraftLocally(answers, step, sopId, sopNumber, false);

  try {
    const res = await fetch('/api/sop-drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: draftKey,
        userEmail,
        answers,
        step,
        sopId,
        sopNumber,
        timestamp
      })
    });

    if (res.ok) {
      // Update local storage with backendSynced flag
      localPayload = saveDraftLocally(answers, step, sopId, sopNumber, true);
      return {
        payload: localPayload,
        backendSuccess: true,
        message: 'Draft saved successfully'
      };
    } else {
      return {
        payload: localPayload,
        backendSuccess: false,
        message: 'Draft saved locally (Server temporarily unavailable)'
      };
    }
  } catch {
    // Network failure / offline: local draft is already intact
    return {
      payload: localPayload,
      backendSuccess: false,
      message: 'Draft saved locally (Network offline / Server unreachable)'
    };
  }
}

/**
 * Load draft checking backend first, fallback to local storage
 */
export async function loadDraftWithBackend(userEmail?: string): Promise<QuestionnaireDraftPayload | null> {
  const draftKey = userEmail ? `draft_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : 'default_user_draft';

  try {
    const res = await fetch(`/api/sop-drafts/${draftKey}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.answers) {
        const payload: QuestionnaireDraftPayload = {
          answers: data.answers,
          step: data.step || 1,
          timestamp: data.timestamp || data.updatedAt || new Date().toISOString(),
          sopId: data.sopId,
          sopNumber: data.sopNumber,
          backendSynced: true
        };
        // Update local storage to match
        saveDraftLocally(payload.answers, payload.step, payload.sopId, payload.sopNumber, true);
        return payload;
      }
    }
  } catch {
    // Server unreachable, proceed to local storage
  }

  return loadDraftLocally();
}

/**
 * Clear draft both from backend and local storage
 */
export async function clearDraftWithBackend(userEmail?: string): Promise<void> {
  clearDraftLocally();
  const draftKey = userEmail ? `draft_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : 'default_user_draft';
  try {
    await fetch(`/api/sop-drafts/${draftKey}`, { method: 'DELETE' });
  } catch {
    // Ignore backend deletion error if offline
  }
}

export function formatSavedTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function formatSavedDateTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '';
  }
}
