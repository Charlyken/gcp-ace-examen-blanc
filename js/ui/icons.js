/* Icônes (SVG en ligne). */
const svg = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
export const IC = {
  clock: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  cross: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  flag: svg('<path d="M5 21V4h11l-1.5 4 1.5 4H5"/>'),
  next: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  prev: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  cloud: svg('<path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 8.5 3.5 3.5 0 0 1 17.5 18Z"/>'),
  cal: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  fire: svg('<path d="M12 21c-4 0-6.5-2.7-6.5-6.2 0-2.6 1.6-4.4 2.8-5.8.3 1.3 1 2.1 1.9 2.4C10.3 8.8 11 5.5 14 3c0 3 1.4 4.3 2.6 5.8 1.3 1.6 1.9 3 1.9 5 0 4-2.6 7.2-6.5 7.2z"/>'),
  edit: svg('<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: svg('<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>')
};
