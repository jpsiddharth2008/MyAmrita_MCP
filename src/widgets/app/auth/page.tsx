'use client';
import React from 'react';
import { z } from 'zod';
import { Shell, Badge } from '../../components/shell';

const schema = z.object({ authenticated: z.boolean() });

export default function Page() {
  return <Shell title="Portal session" schema={schema}>{data => <section className="card">
    <Badge>{data.authenticated ? 'Session available' : 'Signed out'}</Badge>
    <h2>{data.authenticated ? 'Ready to request your portal data' : 'Sign in with your college account'}</h2>
    {data.authenticated ? <><p>The server reports an authenticated session. You can ask for attendance, timetable, marks, leave or gate-pass history.</p><p className="muted">This is the state reported by the tool. If the portal session expires, ask to sign in again. To end the local session, ask to log out in chat.</p></> : <><ol><li>Ask to sign in in chat.</li><li>Open a browser with remote debugging using the command provided by the login tool or project README.</li><li>Leave that browser open and ask to run login. Complete Microsoft sign-in and MFA yourself in the browser.</li></ol><p className="muted">Signing in is manual. Do not enter passwords or verification codes into chat. The public academic calendar is available without a portal session.</p></>}
  </section>}</Shell>;
}
