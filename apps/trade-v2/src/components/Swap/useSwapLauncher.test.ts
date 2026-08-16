import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampLauncherPosition,
  hasOpenSwapLauncherChildLayer,
  hasExceededDragThreshold,
  isSwapLauncherPath,
  isSwapLauncherInteraction,
  isTradePath,
} from './useSwapLauncher';

test('clamps the launcher inside the viewport', () => {
  assert.deepEqual(clampLauncherPosition(-10, -20, 320, 240), {
    x: 0,
    y: 0,
  });
  assert.deepEqual(clampLauncherPosition(400, 300, 320, 240), {
    x: 280,
    y: 200,
  });
  assert.deepEqual(clampLauncherPosition(100, 120, 320, 240), {
    x: 100,
    y: 120,
  });
});

test('uses a strict 6px drag threshold', () => {
  assert.equal(hasExceededDragThreshold(0, 0, 6, 6), false);
  assert.equal(hasExceededDragThreshold(0, 0, 7, 0), true);
  assert.equal(hasExceededDragThreshold(0, 0, 0, -7), true);
});

test('matches Trade routes with and without locale prefixes', () => {
  assert.equal(isTradePath('/trade/BTC-USD'), true);
  assert.equal(isTradePath('/zh-Hans/trade/BTC-USD'), true);
  assert.equal(isTradePath('/en/trade'), true);
  assert.equal(isTradePath('/trades/BTC-USD'), false);
  assert.equal(isTradePath('/swap'), false);
});

test('shows the launcher only on Pool and Vault list and detail routes', () => {
  assert.equal(isSwapLauncherPath('/pools'), true);
  assert.equal(isSwapLauncherPath('/zh-Hans/pools'), true);
  assert.equal(isSwapLauncherPath('/pools/0x123'), true);
  assert.equal(isSwapLauncherPath('/zh-Hans/vaults/0x123'), true);
  assert.equal(isSwapLauncherPath('/referral'), false);
  assert.equal(isSwapLauncherPath('/zh-Hans/leaderboard'), false);
  assert.equal(isSwapLauncherPath('/dashboard'), false);
  assert.equal(isSwapLauncherPath('/trade/BTC-USD'), false);
  assert.equal(isSwapLauncherPath('/pools/0x123/activity'), false);
});

test('keeps launcher interactions open across the token selector portal', () => {
  const inside = {} as Node;
  const outside = {} as EventTarget;
  const portal = {
    closest: (selector: string) =>
      selector.includes('[data-swap-launcher-layer]') ? ({} as Element) : null,
  } as unknown as EventTarget;
  const overlay = {
    closest: (selector: string) =>
      selector.includes('.swap-launcher-layer') ? ({} as Element) : null,
  } as unknown as EventTarget;
  const container = {
    contains: (target: Node | null) => target === inside,
  };

  assert.equal(isSwapLauncherInteraction(container, inside), true);
  assert.equal(isSwapLauncherInteraction(container, portal), true);
  assert.equal(isSwapLauncherInteraction(container, overlay), true);
  assert.equal(isSwapLauncherInteraction(container, outside), false);
});

test('keeps the swap panel open while an open child layer handles outside click', () => {
  assert.equal(
    hasOpenSwapLauncherChildLayer({
      querySelector: () => ({}) as Element,
    }),
    true,
  );
  assert.equal(
    hasOpenSwapLauncherChildLayer({
      querySelector: () => null,
    }),
    false,
  );
});
