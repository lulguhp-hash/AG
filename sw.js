/* АГР НАЛАДИКС — Service Worker: офлайн-кэш оболочки и показ уведомлений (в т.ч. на iPhone в режиме «На экран Домой») */
const CACHE='agr-naladix-ios-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
/* сеть → кэш: свежая версия при наличии интернета, офлайн — из кэша */
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(
    fetch(r).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}
      return res;
    }).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('./index.html'):Response.error())))
  );
});
/* нажатие на уведомление: открыть/сфокусировать приложение */
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const data=e.notification.data||null;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){
      if('focus' in c){c.postMessage({type:'agr-notification-click',item:data});return c.focus()}
    }
    return self.clients.openWindow('./index.html');
  }));
});
