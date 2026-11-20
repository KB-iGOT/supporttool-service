/**
 * Helpers shared by the user certificate views (re-issue certificate tab,
 * Zoho automation certificates view).
 */

const parseMaybeJson = (value: any): any => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

/**
 * External (CIOS / NULP etc.) enrolments come back from the v4 enrolment list
 * with the content record under `content`. That record is the CIOS document,
 * which itself wraps the metadata in another `content` object:
 *   { courseId, status, ..., content: { content: { name, topic, source, appIcon, ... }, competencies_v5, ... } }
 * Some responses are already flat (`content.name`), so support both shapes
 * (and a JSON-string payload) and flatten the metadata onto `content`.
 */
export const normalizeExternalCourse = (extCourse: any) => {
  const raw = parseMaybeJson(extCourse?.content) || {};
  const inner = parseMaybeJson(raw?.content);
  const meta = inner && typeof inner === 'object' && !Array.isArray(inner)
    ? { ...raw, ...inner }
    : { ...raw };

  const courseName =
    meta.name ||
    meta.courseName ||
    extCourse?.courseName ||
    extCourse?.name ||
    'N/A';

  const courseLogoUrl = meta.appIcon || meta.posterImage || meta.thumbnail || extCourse?.courseLogoUrl;
  const courseId = extCourse?.courseId || extCourse?.contentId || meta.contentId;

  return {
    ...extCourse,
    content: meta,
    courseName,
    courseLogoUrl,
    contentId: courseId,
    collectionId: courseId,
    active: meta.isActive ?? extCourse?.active,
    isExternal: true,
  };
};

const UNIT_TO_PX: Record<string, number> = {
  '': 1, px: 1, pt: 96 / 72, pc: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4,
};

const toPx = (value: string | null): number | null => {
  if (!value) return null;
  const match = value.trim().match(/^([0-9.]+)\s*(px|pt|pc|in|cm|mm)?$/i);
  if (!match) return null; // percentages / em etc. cannot be resolved here
  const num = parseFloat(match[1]);
  const factor = UNIT_TO_PX[(match[2] || '').toLowerCase()];
  return Number.isFinite(num) && num > 0 && factor ? num * factor : null;
};

export const decodeSvgDataUri = (dataUri: string): string | null => {
  if (!dataUri?.startsWith('data:image/svg+xml')) return null;
  const commaIdx = dataUri.indexOf(',');
  if (commaIdx < 0) return null;
  const header = dataUri.slice(0, commaIdx);
  const body = dataUri.slice(commaIdx + 1);
  try {
    if (/;base64/i.test(header)) {
      // atob gives a binary string; decode it as UTF-8 so Hindi text survives
      const bytes = Uint8Array.from(atob(body), c => c.charCodeAt(0));
      return new TextDecoder('utf-8').decode(bytes);
    }
    return decodeURIComponent(body);
  } catch {
    return null;
  }
};

/**
 * Certificate SVGs (notably the external-course template) are emitted with a
 * fixed width/height and no viewBox, so they render at full size and get
 * clipped inside the preview dialog. Returns a data URI of the same SVG made
 * responsive (viewBox + 100% size) for display only; downloads keep using the
 * original data. Falls back to the input if it cannot be processed.
 */
export const fitSvgForPreview = (dataUri: string | null): string | null => {
  if (!dataUri) return dataUri;
  const svgText = decodeSvgDataUri(dataUri);
  if (!svgText) return dataUri;

  try {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) {
      return dataUri;
    }

    if (!svg.getAttribute('viewBox')) {
      const w = toPx(svg.getAttribute('width'));
      const h = toPx(svg.getAttribute('height'));
      if (!w || !h) return dataUri; // cannot derive a viewBox safely
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const serialized = new XMLSerializer().serializeToString(svg);
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
  } catch {
    return dataUri;
  }
};
