self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/doctors')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
