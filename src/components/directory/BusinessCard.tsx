import { Heart, BadgeCheck, Star, ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useDirectory } from './DirectoryContext';
import type { Business } from '@/lib/rtm/directory';
import cafe from '@/assets/cafe.jpg'; import florist from '@/assets/florist.jpg'; import books from '@/assets/books.jpg';
export const PHOTOS = {cafe,florist,books};
export function BusinessCard({business:b}: {business:Business}) {
 const {saved,toggleSaved,reviews}=useDirectory(); const added=reviews.filter(r=>r.business===b.id);
 return <article className="business-card group overflow-hidden rounded-lg border bg-card">
 <div className="relative aspect-[1.6] overflow-hidden"><Link to="/business/$id" params={{id:b.id}}><img src={PHOTOS[b.photo]} alt={b.name} loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/></Link>
 {b.verified&&<span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold text-primary"><BadgeCheck size={13}/>Verified</span>}
 <Button size="icon" variant="secondary" className="absolute right-3 top-3 rounded-full bg-card" aria-label={`${saved.includes(b.id)?'Unsave':'Save'} ${b.name}`} onClick={()=>toggleSaved(b.id)}><Heart className={saved.includes(b.id)?'fill-primary text-primary':''}/></Button></div>
 <div className="p-4"><div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span>{b.category} <span className="px-1">·</span> {b.neighborhood}</span><span>{b.distance}</span></div><Link to="/business/$id" params={{id:b.id}} className="flex items-center justify-between"><h3 className="text-lg font-bold">{b.name}</h3><ArrowUpRight size={17} className="text-muted-foreground"/></Link>
 <div className="mt-1 flex items-center gap-1 text-xs"><Star size={13} className="fill-rating text-rating"/><b>{b.rating}</b><span className="text-muted-foreground">({b.reviews+added.length} reviews)</span></div>
 <p className="mt-3 line-clamp-2 min-h-10 text-[13px] leading-5 text-muted-foreground">{b.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{b.ownership.map(o=><span key={o} className={`ownership-tag ${o==='Women-owned'?'ownership-rose':o==='Veteran-owned'?'ownership-gold':''}`}>{o}</span>)}</div></div></article>;
}
