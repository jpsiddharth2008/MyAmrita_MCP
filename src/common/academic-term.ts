import type { CheerioAPI } from 'cheerio';

export interface AcademicTerm {
  id: string;
  label: string;
}

/**
 * Reads the currently-selected <option> from a page's academic_term_id <select>.
 *
 * Different portal pages default to different terms (e.g. attendance and marks
 * have been observed defaulting to different semesters on the same account),
 * and neither is guaranteed to match the actual current calendar semester if
 * the college hasn't activated it yet. Callers should surface this alongside
 * the data rather than assume it's "current".
 */
export function parseSelectedAcademicTerm($: CheerioAPI): AcademicTerm | null {
  const selected = $('select[name="academic_term_id"] option[selected]');
  if (selected.length === 0) return null;

  const id = selected.attr('value');
  const label = selected.text().trim();
  if (!id || !label) return null;

  return { id, label };
}
