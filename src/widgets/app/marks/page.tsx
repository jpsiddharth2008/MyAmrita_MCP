'use client';
import React, { useState } from 'react';
import { z } from 'zod';
import { Shell, Term, Empty, Badge, termSchema } from '../../components/shell';

const schema = z.object({ term: termSchema, marks: z.array(z.object({ courseName: z.string(), courseCode: z.string(), marksObtained: z.number().finite(), maxMarks: z.number().finite(), componentName: z.string(), examName: z.string() })) });

function Marks({ data }: { data: z.infer<typeof schema> }) {
  const [query, setQuery] = useState('');
  const matches = data.marks.filter(m => `${m.courseName} ${m.courseCode} ${m.componentName} ${m.examName}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <><Term term={data.term}/><div className="toolbar"><label>Search assessments<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Course, component or exam"/></label></div><p className="muted">{matches.length} assessments · Scores as reported by the portal; components may have different weights.</p>
    {!matches.length ? <Empty>No assessments match this view.</Empty> : <div className="cards">{matches.map((m,i) => <article className="card" key={`${m.courseCode}-${m.componentName}-${i}`}><Badge>{m.courseCode}</Badge><h2>{m.courseName}</h2><p>{m.componentName} · {m.examName}</p><p className="value">{m.marksObtained} / {m.maxMarks}</p><p className="muted">{m.maxMarks > 0 ? `${Math.round(m.marksObtained / m.maxMarks * 1000) / 10}% of this component's maximum` : 'Percentage unavailable: maximum marks is zero or unavailable.'}</p></article>)}</div>}</>;
}
export default function Page() { return <Shell title="Assessment marks" schema={schema}>{data => <Marks data={data}/>}</Shell>; }
