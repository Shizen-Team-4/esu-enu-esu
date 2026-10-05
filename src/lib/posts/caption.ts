/** Captions longer than this get a "more" toggle (a simple count, no DOM measuring). */
export const LONG_CAPTION_CHARS = 140

export const isLongCaption = (caption: string): boolean => caption.length > LONG_CAPTION_CHARS
