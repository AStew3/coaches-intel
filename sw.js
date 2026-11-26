// RecruitDirect / Fair Catch install shell: keeps the shell pages available; the apps themselves always load live.
const C = 'ci-shell-10', FILES = ['./', './fc/', './icons/rd4-192.png', './icons/hs-splash.webp', './icons/fc-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});

// phone alerts: the push carries no data; ask RecruitDirect what happened, then show it
const API = 'https://script.google.com/macros/s/AKfycbzOFyYpLjZkA8kjXsr_63U5g9HhUV5ifNuNx0ALmaIc3QNbr0o7CKq9HGvalxk0D5xDfQ/exec';
self.addEventListener('push', e => {
  e.waitUntil(self.registration.pushManager.getSubscription()
    .then(s => s ? fetch(API + '?pp=' + encodeURIComponent(s.endpoint)).then(r => r.json()) : { alerts: [] })
    .catch(() => ({ alerts: [] }))
    .then(d => {
      let a = (d && d.alerts) || [];
      if (!a.length) a = [{ title: 'RecruitDirect', body: 'News from a coach. Tap to see.', tag: 'ci-news' }];
      return Promise.all(a.slice(-3).map(x => self.registration.showNotification(x.title || 'RecruitDirect', {
        body: x.body || '', tag: x.tag || ('ci-' + Date.now() + Math.random()), icon: 'icons/rd4-192.png', data: { url: './' }
      })));
    }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.indexOf(self.registration.scope) === 0 && c.url.indexOf('/fc/') < 0 && 'focus' in c) return c.focus();
    return self.clients.openWindow(url);
  }));
});
