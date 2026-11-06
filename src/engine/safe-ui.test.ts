import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Guard against restoring the unsafe auto-credit wiring while #6 remains open.
test('workspace does not credit regex-only reports as completed tasks', () => {
  const workspace = readFileSync('src/components/EngineeringWorkspace.tsx', 'utf8');
  assert.doesNotMatch(workspace, /evaluateCSharpTask\s*\(/);
  assert.doesNotMatch(workspace, /onTaskPassed\s*\(/);
  assert.match(workspace, /прохождение не засчитано/);
});

test('fresh fallback progress is empty', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const server = readFileSync('server.ts', 'utf8');
  assert.match(app, /useState<number>\(0\)/);
  assert.match(server, /completedTasks:\s*\[\]/);
});
