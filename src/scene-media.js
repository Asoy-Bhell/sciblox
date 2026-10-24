// Add licensed, exported media here and under public/assets/bhell/.
// Files are bundled for offline use; no external media URLs are accepted.
export const BHELL_MEDIA={introductions:{},dialogue:{}};
export function localMedia(path){return typeof path==='string'&&/^\/assets\/bhell\/[\w./-]+\.(mp4|webm|mp3|wav|ogg)$/.test(path)&&!path.includes('..')?path:null}
