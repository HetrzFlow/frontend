import assert from 'node:assert/strict';
import test from 'node:test';
import { getFirstVisitDialogState } from './dialogState.ts';

test('shows the first visit risk notice before it is accepted', () => {
  const result = getFirstVisitDialogState({
    hasAcceptedInviteCodeDialog: false,
  });

  assert.equal(result.shouldShowFirstVisitDialog, true);
});

test('hides the first visit risk notice after it is accepted', () => {
  const result = getFirstVisitDialogState({
    hasAcceptedInviteCodeDialog: true,
  });

  assert.equal(result.shouldShowFirstVisitDialog, false);
});

test('hides the first visit risk notice when it is disabled for the route', () => {
  const result = getFirstVisitDialogState({
    hasAcceptedInviteCodeDialog: false,
    disabled: true,
  });

  assert.equal(result.shouldShowFirstVisitDialog, false);
});
