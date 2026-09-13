import * as cheerio from 'cheerio';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { AnyNode } from 'domhandler';

/** Decodes HTML entities (e.g. &nbsp;) in a fragment by round-tripping it through cheerio's text extraction. */
export function decodeHtmlText(html: string): string {
  return cheerio.load(`<div>${html}</div>`)('div').text();
}

/** Splits a table cell's inner HTML on <br> tags into trimmed, non-empty, entity-decoded text lines. */
export function splitCellLines(cellHtml: string): string[] {
  return cellHtml
    .split(/<br\s*\/?>/i)
    .map((part) => decodeHtmlText(part).trim())
    .filter((part) => part.length > 0);
}

/**
 * Iterates matched rows and maps each row's cells into a value via `mapRow`.
 * Rows with fewer than `minCells` <th>/<td> cells are skipped rather than
 * crashing on a stray malformed row.
 *
 * By default the first matched row is skipped as a header row — true for
 * every portal table observed so far where header and data rows sit in the
 * same <tbody> (or no <thead>/<tbody> split at all). Pass
 * `skipFirstRow: false` for a table with a proper <thead>, where the row
 * selector (e.g. "table tbody tr") already excludes the header.
 */
export function parseDataRows<T>(
  $: CheerioAPI,
  rowSelector: string,
  minCells: number,
  mapRow: (cells: Cheerio<AnyNode>[]) => T,
  options: { skipFirstRow?: boolean } = {}
): T[] {
  const skipFirstRow = options.skipFirstRow ?? true;
  const results: T[] = [];

  $(rowSelector).each((i, el) => {
    if (skipFirstRow && i === 0) return;

    const cells = $(el).find('th, td');
    if (cells.length < minCells) return;

    results.push(mapRow(cells.toArray().map((c) => $(c))));
  });

  return results;
}
