export function channelUrl(value) {
  try {
    const url=new URL(value);
    return url.protocol==='https:'&&['whatsapp.com','www.whatsapp.com'].includes(url.hostname)&&!url.port&&!url.username&&!url.password&&/^\/channel\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)?url.href:null;
  } catch { return null; }
}
