'use client';
import React, { useState } from 'react';
import { z } from 'zod';
import { Shell, Empty, Badge } from '../../components/shell';

const schema = z.object({ entries: z.array(z.object({ id: z.string(), type: z.string(), from: z.string(), to: z.string(), status: z.string(), reason: z.string(), createdOn: z.string() })) });

function Leave({ data }: { data: z.infer<typeof schema> }) {
  const [status, setStatus] = useState('');
  const statuses = [...new Set(data.entries.map(e => e.status))];
  const active = statuses.includes(status) ? status : '';
  const entries = data.entries.filter(e => !active || e.status === active);
  return <><div className="toolbar"><label>Request status<select aria-label="Request status" value={active} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.filter(Boolean).map(s => <option key={s}>{s}</option>)}</select></label></div><p className="muted">{entries.length} requests · Dates and statuses as reported by the portal.</p>
    {!entries.length ? <Empty>No leave requests in this view.</Empty> : <div className="cards">{entries.map((e,i) => <article className="card" key={`${e.id}-${i}`}><Badge>{e.status || 'Status not provided'}</Badge><h2>{e.type}</h2><p>{e.reason || 'Reason not provided'}</p><dl><dt>From</dt><dd>{e.from}</dd><dt>To</dt><dd>{e.to}</dd><dt>Created</dt><dd>{e.createdOn}</dd><dt>Request ID</dt><dd>{e.id}</dd></dl></article>)}</div>}</>;
}
export default function Page() { return <Shell title="Leave requests" schema={schema}>{data => <Leave data={data}/>}</Shell>; }
