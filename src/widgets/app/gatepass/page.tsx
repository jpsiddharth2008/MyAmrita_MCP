'use client';
import React from 'react';
import { z } from 'zod';
import { Shell, Empty, Badge } from '../../components/shell';

const request = z.object({ passType: z.enum(['home', 'out']), reason: z.string(), from: z.string(), to: z.string() });
const passes = z.array(z.object({ id: z.string(), passName: z.string(), from: z.string(), to: z.string(), levelStatus: z.string(), finalStatus: z.string(), createdOn: z.string() }));
const schema = z.union([
  z.object({ submitted: z.literal(false), message: z.string(), preview: request }),
  z.object({ submitted: z.literal(true), request, gatePasses: passes }),
  z.object({ gatePasses: passes }).strict(),
]);

function RequestDetails({ data }: { data: z.infer<typeof request> }) {
  return <><h2>{data.passType === 'home' ? 'Home Pass' : 'Out Pass'}</h2><p>{data.reason}</p><dl><dt>Leaving</dt><dd>{data.from}</dd><dt>Returning</dt><dd>{data.to}</dd></dl></>;
}

function GatePass({ data }: { data: z.infer<typeof schema> }) {
  return <>{'submitted' in data && <section className="notice" aria-label="Request result"><Badge>{data.submitted ? 'Submitted · approval pending verification' : 'Preview only · not submitted'}</Badge><RequestDetails data={data.submitted ? data.request : data.preview}/><p>{data.submitted ? 'The submission tool completed. Check the portal history below for approval status; submission does not mean approval.' : 'To submit, confirm these exact details in chat. Nothing has been sent to the portal.'}</p></section>}
    <p className="muted">Gate passes must be approved at least 30 minutes before leaving. Dates and statuses below are reported by the portal.</p>
    {'gatePasses' in data && (!data.gatePasses.length ? <Empty>No gate passes returned by the portal.</Empty> : <div className="cards">{data.gatePasses.map((p,i) => <article className="card" key={`${p.id}-${i}`}><Badge>{p.finalStatus || 'Final status not provided'}</Badge><h2>{p.passName}</h2><dl><dt>From</dt><dd>{p.from}</dd><dt>To</dt><dd>{p.to}</dd><dt>Level status</dt><dd>{p.levelStatus || 'Not provided'}</dd><dt>Final status</dt><dd>{p.finalStatus || 'Not provided'}</dd><dt>Created</dt><dd>{p.createdOn}</dd><dt>Request ID</dt><dd>{p.id}</dd></dl></article>)}</div>)}</>;
}
export default function Page() { return <Shell title="Gate passes" schema={schema}>{data => <GatePass data={data}/>}</Shell>; }
