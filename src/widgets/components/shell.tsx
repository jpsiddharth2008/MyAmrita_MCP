'use client';

import React from 'react';
import { WidgetLayout, useWidgetSDK } from '@nitrostack/widgets';
import { z } from 'zod';

const styles = `
*{box-sizing:border-box}body{margin:0}.widget{--bg:#f5f7fb;--card:#fff;--ink:#18233b;--muted:#56637a;--line:#d7dfeb;--accent:#7c2147;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif;padding:24px;min-height:220px;overflow:auto}
.widget[data-theme=dark]{--bg:#101725;--card:#1b2537;--ink:#edf2fa;--muted:#b5c2d6;--line:#39485e;--accent:#ffa7ca;color-scheme:dark}
.eyebrow{color:var(--accent);font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}h1{font-size:26px;letter-spacing:-.04em;margin:5px 0 16px}h2{font-size:17px;margin:0 0 8px}p{margin:8px 0}.muted{color:var(--muted)}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:12px}.card,.notice{border:1px solid var(--line);border-radius:14px;background:var(--card);padding:18px;overflow-wrap:anywhere}.notice{margin:12px 0}.toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin:16px 0}label{display:flex;flex-direction:column;gap:5px;font-weight:600;font-size:13px}input,select,button{font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px;min-height:44px;max-width:100%}input[type=checkbox]{min-height:20px;width:20px}input:focus-visible,select:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:3px}.badge{display:inline-block;border:1px solid var(--line);padding:3px 9px;border-radius:20px;font-size:12px;font-weight:700}.value{font-size:27px;font-weight:750;color:var(--accent)}dl{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0}dt{color:var(--muted)}dd{margin:0;text-align:right;overflow-wrap:anywhere}progress{width:100%;accent-color:var(--accent)}summary{cursor:pointer;min-height:44px;padding-top:10px}ul{padding-left:20px}li{margin:6px 0}.stack{display:grid;gap:12px}.widget header{border-bottom:1px solid var(--line);margin-bottom:18px} @media(max-width:440px){.widget{padding:16px}h1{font-size:23px}.toolbar>*{width:100%}}
`;

export function Shell<T>({ title, schema, children }: { title: string; schema: z.ZodType<T, z.ZodTypeDef, any>; children: (data: T) => React.ReactNode }) {
  return <WidgetLayout><Content title={title} schema={schema}>{children}</Content></WidgetLayout>;
}

function Content<T>({ title, schema, children }: { title: string; schema: z.ZodType<T, z.ZodTypeDef, any>; children: (data: T) => React.ReactNode }) {
  const { isReady, getToolOutput, theme } = useWidgetSDK();
  const raw = getToolOutput<unknown>();
  const error = z.object({ error: z.string(), message: z.string().optional() }).safeParse(raw);
  const parsed = schema.safeParse(raw);
  return <main className="widget" data-theme={theme === 'dark' ? 'dark' : 'light'}>
    <style>{styles}</style><header><div className="eyebrow">My Amrita · Student portal</div><h1>{title}</h1></header>
    {!isReady ? <p role="status">Connecting to host…</p> : raw == null ? <p role="status">Waiting for tool results…</p> : error.success ? <div className="notice" role="alert"><h2>{error.data.error === 'session_expired' ? 'Sign in again' : 'Unable to load results'}</h2><p>{error.data.message || error.data.error}</p></div> : !parsed.success ? <p role="alert">The tool returned an unexpected response. Please run the tool again.</p> : children(parsed.data)}
  </main>;
}

export const termSchema = z.object({ id: z.string(), label: z.string() }).nullable();
export function Term({ term }: { term: { label: string } | null }) { return <p className="muted">Academic term: <strong>{term?.label || 'Not provided by the portal'}</strong></p>; }
export function Empty({ children }: { children: React.ReactNode }) { return <p className="notice" role="status">{children}</p>; }
export function Badge({ children }: { children: React.ReactNode }) { return <span className="badge">{children}</span>; }
