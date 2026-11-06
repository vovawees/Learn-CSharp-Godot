import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_TASKS } from '../data/curriculum';
import { evaluateCSharpTask, simulateClrAndGodotFrame } from './csharpEvaluator';

test('Starter code is detected as stub and does not falsely pass', () => {
  for (const task of CURRICULUM_TASKS) {
    const res = evaluateCSharpTask(task.id, task.starterCode);
    assert.equal(res.isStubOrEmpty, true);
    assert.equal(res.goalPassed, false);
    assert.equal(res.allContractsPassed, false);
  }
});

test('Anti-copy-paste blocks naive trap code across all tasks', () => {
  for (const task of CURRICULUM_TASKS) {
    const res = evaluateCSharpTask(task.id, task.naiveCopyTrapCode);
    assert.equal(res.isAntiCopyPasteTriggered, true);
    assert.equal(res.goalPassed, false);
  }
});

test('Both reference solution and alternative syntax solution pass 100% of contracts (Goal-Driven flexibility)', () => {
  for (const task of CURRICULUM_TASKS) {
    const refRes = evaluateCSharpTask(task.id, task.referenceCleanSolution);
    assert.equal(refRes.goalPassed, true, `Reference solution failed goal for ${task.id}`);
    assert.equal(refRes.optimizationPassed, true, `Reference solution failed optimization for ${task.id}`);
    assert.equal(refRes.allContractsPassed, true);

    const altRes = evaluateCSharpTask(task.id, task.alternativeValidSolution);
    assert.equal(altRes.goalPassed, true, `Alternative solution failed goal for ${task.id}`);
    assert.equal(altRes.optimizationPassed, true, `Alternative solution failed optimization for ${task.id}`);
    assert.equal(altRes.allContractsPassed, true);
  }
});

test('Goal-first philosophy: code that achieves functional goal with class instead of struct passes goalPassed but flags optimizationPassed', () => {
  const suboptimalClassCode = `
    public class KineticImpulse {
      public float Velocity;
      public float Damping;
      public float CalculateNext(float dt) {
        float v = Velocity * (1f - Damping * dt);
        return v <= 0.01f ? 0f : v;
      }
    }
  `;
  const res = evaluateCSharpTask('cs-val-ref-01', suboptimalClassCode);
  assert.equal(res.goalPassed, true);
  assert.equal(res.optimizationPassed, false);
  assert.ok(res.heapAllocationBytes > 0);
});

test('CLR and Godot 4.8 frame simulator accurately models Zero-GC vs Heap Allocation pressure', () => {
  const optimal = simulateClrAndGodotFrame({
    entityCount: 1000,
    useValueTypeStruct: true,
    useSpanSlice: true,
    cacheGodotNodesInReady: true,
    physicsTickHz: 120,
    deltaSeconds: 0.00833
  });
  assert.equal(optimal.gen0HeapBytesPerSecond, 0);
  assert.equal(optimal.statusLevel, 'optimal');

  const leaky = simulateClrAndGodotFrame({
    entityCount: 2000,
    useValueTypeStruct: false,
    useSpanSlice: false,
    cacheGodotNodesInReady: false,
    physicsTickHz: 120,
    deltaSeconds: 0.00833
  });
  assert.ok(leaky.gen0HeapBytesPerSecond > 10_000_000);
  assert.equal(leaky.statusLevel, 'critical');
});
