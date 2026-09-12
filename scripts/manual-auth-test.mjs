// One-off manual test for the interactive login flow, run directly (not through
// NitroStudio) so nothing imposes a short request timeout on a call that
// legitimately needs minutes for a human to complete Microsoft SSO + MFA.
//
// Usage:
//   npm run build
//   node scripts/manual-auth-test.mjs
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TEN_MINUTES = 10 * 60 * 1000;

async function callTool(client, name, args = {}) {
  console.log(`\n--- calling ${name} ---`);
  const res = await client.callTool({ name, arguments: args }, undefined, { timeout: TEN_MINUTES });
  for (const item of res.content ?? []) {
    if (item.type === 'text') console.log(item.text);
  }
  return res;
}

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    cwd: projectDir,
    env: { ...process.env, NODE_ENV: 'production' },
  });

  const client = new Client({ name: 'manual-test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  await callTool(client, 'auth_status');
  console.log('\nOpening browser for login — take your time, this will wait up to 10 minutes.');
  await callTool(client, 'auth_login');
  await callTool(client, 'auth_status');
  await callTool(client, 'attendance_get_attendance');
  await callTool(client, 'attendance_get_low_attendance_subjects', { threshold: 90 });

  await client.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Manual test failed:', err);
  process.exit(1);
});
