// Отдельный scope /app: не заменяет push-подписку ELC CRM и не кэширует страницы.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 event.waitUntil(self.registration.showNotification(data.title||'Дела Pllato',{body:data.body||'Обновление дела',tag:data.tag||'task',icon:'/pllato_icon.svg',data:{url:data.url||'/app'}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const url=new URL(event.notification.data?.url||'/app',self.location.origin);
 if(url.origin!==self.location.origin)return;
 event.waitUntil((async()=>{const pages=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const page of pages){const current=new URL(page.url);if(current.pathname==='/app'||current.pathname==='/app.html'){await page.navigate(url.href);await page.focus();return;}}await self.clients.openWindow(url.href);})());
});
