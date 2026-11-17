import { createContext, useContext, useState, type ReactNode } from 'react';
import { LISTINGS, type Business } from '@/lib/rtm/directory';
type Review = { business: string; stars: number; text: string; name: string };
type State = { listings: Business[]; setVerified: (id: string, value: boolean) => void; saved: string[]; toggleSaved: (id: string) => void; reviews: Review[]; addReview: (r: Review) => void; claims: string[]; claim: (id: string) => void };
const Context = createContext<State | null>(null);
export function DirectoryProvider({children}: {children: ReactNode}) {
 const [listings,setListings]=useState(LISTINGS); const [saved,setSaved]=useState<string[]>([]); const [reviews,setReviews]=useState<Review[]>([]); const [claims,setClaims]=useState<string[]>([]);
 return <Context.Provider value={{listings,setVerified:(id,value)=>setListings(v=>v.map(b=>b.id===id?{...b,verified:value}:b)),saved,toggleSaved:id=>setSaved(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]),reviews,addReview:r=>setReviews(v=>[r,...v]),claims,claim:id=>setClaims(v=>v.includes(id)?v:[...v,id])}}>{children}</Context.Provider>;
}
export function useDirectory() { const value=useContext(Context); if(!value) throw new Error('Directory provider is required'); return value; }
