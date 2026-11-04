'use client';
import React, { useState } from 'react';
import { z } from 'zod';
import { Shell, Empty, Badge } from '../../components/shell';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({ from: isoDate.optional(), to: isoDate.optional(), events: z.array(z.object({ title: z.string(), startDate: isoDate, endDate: isoDate })) });

function Calendar({ data }: { data: z.infer<typeof schema> }) {
  const [query, setQuery] = useState('');
  const events = data.events.filter(e => e.title.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title));
  return <><p className="muted">Public institutional calendar · Date ranges include both start and end dates.</p>{data.from && data.to && <p className="notice">Requested window: {data.from} through {data.to}. Events overlapping this window are included.</p>}
    <div className="toolbar"><label>Search events<input type="search" value={query} placeholder="Exam, holiday or event" onChange={e => setQuery(e.target.value)}/></label></div><p className="muted">{events.length} events shown</p>
    {!events.length ? <Empty>No calendar events match this view.</Empty> : <div className="stack">{events.map((e,i) => <article className="card" key={`${e.startDate}-${e.title}-${i}`}><Badge>{e.startDate === e.endDate ? 'Single day' : 'Multiple days'}</Badge><h2>{e.title}</h2><p><time dateTime={e.startDate}>{e.startDate}</time>{e.endDate !== e.startDate && <> through <time dateTime={e.endDate}>{e.endDate}</time></>}</p></article>)}</div>}</>;
}
export default function Page() { return <Shell title="Academic calendar" schema={schema}>{data => <Calendar data={data}/>}</Shell>; }
