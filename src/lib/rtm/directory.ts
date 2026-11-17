export type Ownership = 'Black-owned' | 'Women-owned' | 'Veteran-owned' | 'LGBTQ+-owned';
export type Business = { id: string; name: string; category: string; neighborhood: string; description: string; ownership: Ownership[]; verified: boolean; rating: number; reviews: number; distance: string; photo: 'cafe' | 'florist' | 'books'; x: number; y: number };
export const LISTINGS: Business[] = [
 {id:'juniper',name:'Juniper & Honey',category:'Food & Drink',neighborhood:'Shaw',description:'Good coffee, fresh pastries, and a little room to slow down. Your neighborhood morning ritual.',ownership:['Black-owned','Women-owned'],verified:true,rating:4.9,reviews:128,distance:'0.3 mi',photo:'cafe',x:330,y:210},
 {id:'bloom',name:'The Bloom Room',category:'Shopping',neighborhood:'Logan Circle',description:'Seasonal flowers, thoughtful bouquets, and a little everyday joy. Made with love, just around the corner.',ownership:['Women-owned'],verified:true,rating:4.8,reviews:86,distance:'0.6 mi',photo:'florist',x:510,y:300},
 {id:'chapter',name:'Next Chapter Books',category:'Arts & Culture',neighborhood:'Capitol Hill',description:'Stories worth sharing. An independent bookstore for curious minds, little readers, and the whole community.',ownership:['Veteran-owned'],verified:true,rating:4.9,reviews:94,distance:'0.8 mi',photo:'books',x:380,y:420},
 {id:'little',name:'Little Sunday Café',category:'Food & Drink',neighborhood:'Petworth',description:'Slow mornings, delicious brunch, and a warm welcome for everyone.',ownership:['LGBTQ+-owned','Black-owned'],verified:false,rating:4.7,reviews:62,distance:'1.1 mi',photo:'cafe',x:640,y:220},
 {id:'wild',name:'Wildflower Studio',category:'Shopping',neighborhood:'Dupont Circle',description:'Locally arranged flowers for celebrations big and small.',ownership:['Women-owned','Black-owned'],verified:true,rating:4.8,reviews:51,distance:'1.2 mi',photo:'florist',x:540,y:440},
 {id:'paper',name:'Paper & People',category:'Arts & Culture',neighborhood:'Georgetown',description:'Books, stationery, and neighborhood conversations.',ownership:['Women-owned'],verified:false,rating:4.6,reviews:43,distance:'1.4 mi',photo:'books',x:210,y:330}
];
export function filterListings(listings: Business[], query: string, category: string, ownership: string[], verified: boolean) {
 const q = query.trim().toLowerCase();
 return listings.filter(b => (!q || `${b.name} ${b.description} ${b.category} ${b.neighborhood}`.toLowerCase().includes(q)) && (category === 'All places' || b.category === category) && (!ownership.length || ownership.some(o => b.ownership.includes(o as Ownership))) && (!verified || b.verified));
}
