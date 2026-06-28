import DOMPurify from 'dompurify';

/** Sanitize inbound/outbound email HTML before rendering in the DOM. */
export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
}
