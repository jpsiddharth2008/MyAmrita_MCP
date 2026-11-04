'use client';
import React, { useState } from 'react';
import { z } from 'zod';
import { Shell, Empty, Badge } from '../../components/shell';

const period = z.object({ period: z.number(), lines: z.array(z.string()).nullable() });
const schema = z.union([
  z.object({ days: z.array(z.object({ day: z.string(), periods: z.array(period) })) }),
  z.object({ date: z.string(), day: z.string(), periods: z.array(period) }),
]);

function Timetable({ data }: { data: z.infer<typeof schema> }) {
  const [selected, setSelected] = useState('');
  const days = 'days' in data ? data.days : [{ day: data.day, periods: data.periods }];
  const active = days.find(d => d.day === selected) ?? days[0];
  return <>{'date' in data && <p className="notice">{data.date} · {data.day}</p>}
    <p className="muted">Based on the weekly timetable. Holidays and special day-order changes may differ.</p>
    {'days' in data && days.length > 0 && <div className="toolbar"><label>Day<select aria-label="Day" value={active?.day ?? ''} onChange={e => setSelected(e.target.value)}>{days.map((d,i) => <option key={`${d.day}-${i}`}>{d.day}</option>)}</select></label></div>}
    {!active || active.periods.length === 0 ? <Empty>No scheduled classes in this view.</Empty> : <section aria-label={`${active.day} periods`} className="cards">{active.periods.map((p,i) => <article className="card" key={`${p.period}-${i}`}><Badge>Period {p.period}</Badge>{!p.lines?.length ? <p className="muted">Free period</p> : p.lines.map((line,j) => <p key={j}>{line}</p>)}</article>)}</section>}</>;
}
export default function Page() { return <Shell title="Timetable" schema={schema}>{data => <Timetable data={data}/>}</Shell>; }
