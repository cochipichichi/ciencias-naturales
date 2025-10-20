
self.addEventListener('install',e=>{
  e.waitUntil(caches.open('cn-oa2-v1').then(c=>c.addAll([
    '../index.html','../style.css','../js/script.js',
    '../quiz/quiz.html','../ticket/ticket.html'
  ])));
});
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
