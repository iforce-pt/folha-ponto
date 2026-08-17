// Service worker mínimo — apenas torna a app instalável ("Adicionar ao ecrã principal")
// e guarda uma cópia do "invólucro" da app para abrir mais depressa.
// NÃO armazena dados da folha de ponto (esses vêm sempre da rede, do Supabase).

var CACHE_NAME = "folha-ponto-shell-v1";
var SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(SHELL_FILES).catch(function(){ /* ignora falhas individuais */ });
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  // Só trata pedidos GET, do mesmo site (deixa passar tudo o resto direto para a rede,
  // incluindo todas as chamadas ao Supabase — nunca as põe em cache).
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin){
    return;
  }
  event.respondWith(
    fetch(req).then(function(res){
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){ return cached || caches.match("./index.html"); });
    })
  );
});
