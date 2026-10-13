// Optional user-facing names; IDs remain stable for linked payment tasks.
export function paymentCardTitle(value){return String(value||'').trim().slice(0,500);}
export function paymentLabel(value,fallback=''){return String(value||'').trim().slice(0,120)||fallback;}
