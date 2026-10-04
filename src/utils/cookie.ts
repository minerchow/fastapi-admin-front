export function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
  if (typeof maxAgeSeconds === "number") {
    cookie += `; Max-Age=${maxAgeSeconds}`;
  }
  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  const target = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(";")) {
    const item = part.trim();
    if (item.startsWith(target)) {
      return decodeURIComponent(item.slice(target.length));
    }
  }
  return null;
}

export function removeCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0`;
}
