// Existing brand-material originals; never use mirrored logos for outgoing video.
export const MEET_BACKGROUNDS = {
 'office-host':{label:'Ресепшен',url:'/assets/meet/office-reception.jpg'},
 'office-client':{label:'Светлый офис',url:'/assets/meet/office-neutral.jpg'},
 'office-minimal':{label:'Минимализм',url:'/app/brand-materials/previews/pllato-office-minimal-original.jpg'},
 'office-dark':{label:'Кабинет',url:'/app/brand-materials/previews/pllato-office-dark-original.jpg'},
};
export function hostBackground(peerId,hosts){
 const ids=[...new Set([...hosts,peerId])].sort();
 return Object.keys(MEET_BACKGROUNDS)[ids.indexOf(peerId)%Object.keys(MEET_BACKGROUNDS).length];
}
