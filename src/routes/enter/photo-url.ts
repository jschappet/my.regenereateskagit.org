export function displayPhotoUrl(location: string, pageOrigin: string) {
 const value = location.trim();
 if (!value) return '';

 try {
  const origin = new URL(pageOrigin);
  const url = new URL(value, origin);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return '';
  if (url.pathname.startsWith('/webroot/')) url.pathname = url.pathname.slice('/webroot'.length);
  if (origin.protocol === 'https:' && url.protocol === 'http:' && url.host === origin.host) {
   url.protocol = 'https:';
  }
  return url.href;
 } catch {
  return '';
 }
}
