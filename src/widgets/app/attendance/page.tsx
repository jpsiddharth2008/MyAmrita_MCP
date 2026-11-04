'use client';
import React, { useState } from 'react';
import { z } from 'zod';
import { Shell, Term, Empty, Badge, termSchema } from '../../components/shell';

const schema = z.object({ term: termSchema, threshold: z.number().optional(), subjects: z.array(z.object({
  courseCode: z.string(), courseName: z.string(), className: z.string(), faculty: z.array(z.string()),
  total: z.number().finite(), present: z.number().finite(), absent: z.number().finite(), dutyLeave: z.number().finite(), medical: z.number().finite(), percentage: z.number().finite(),
})), summary: z.object({ totalClasses: z.number(), totalPresent: z.number(), overallPercentage: z.number() }).optional() });

function Attendance({ data }: { data: z.infer<typeof schema> }) {
  const [threshold, setThreshold] = useState(75);
  const [lowOnly, setLowOnly] = useState(false);
  const cutoff = data.threshold ?? threshold;
  const subjects = data.subjects.filter(s => !lowOnly || s.percentage < cutoff);
  return <><Term term={data.term}/>{data.summary && <div className="notice"><span className="value">{data.summary.overallPercentage}%</span><p>Overall attendance · {data.summary.totalPresent} present / {data.summary.totalClasses} classes</p></div>}
    {data.threshold !== undefined && <p className="notice">Returned subjects below {data.threshold}%. This result is already filtered by the tool.</p>}
    <div className="toolbar">{data.threshold === undefined && <label>Attendance threshold (%)<input type="number" min="0" max="100" value={threshold} onChange={e => setThreshold(Math.min(100, Math.max(0, Number(e.target.value))))}/></label>}<label><span>Show only below {cutoff}%</span><input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)}/></label></div>
    <p className="muted">{subjects.length} subjects shown</p>{subjects.length === 0 ? <Empty>No subjects match this attendance view.</Empty> : <div className="cards">{subjects.map((s,i) => <article className="card" key={`${s.courseCode}-${i}`}><Badge>{s.courseCode}</Badge><h2>{s.courseName}</h2><p className="value">{s.percentage}%</p><progress aria-label={`${s.courseName} attendance`} max="100" value={Math.min(100, Math.max(0,s.percentage))}/><p>{s.percentage < cutoff ? `Below ${cutoff}% threshold` : `At or above ${cutoff}% threshold`}</p><dl><dt>Present / total</dt><dd>{s.present} / {s.total}</dd><dt>Absent</dt><dd>{s.absent}</dd><dt>Duty leave</dt><dd>{s.dutyLeave}</dd><dt>Medical</dt><dd>{s.medical}</dd></dl><details><summary>Class and faculty</summary><p>{s.className}</p><p>{s.faculty.join(', ') || 'Faculty not provided'}</p></details></article>)}</div>}</>;
}
export default function Page() { return <Shell title="Attendance" schema={schema}>{data => <Attendance data={data}/>}</Shell>; }
