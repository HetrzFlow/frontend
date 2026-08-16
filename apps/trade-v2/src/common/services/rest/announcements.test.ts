import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractAnnouncements,
  type AnnouncementsApiResponse,
} from './announcements';

test('extracts announcements from standard backend success wrapper', () => {
  const response: AnnouncementsApiResponse = {
    code: 200,
    msg: '',
    data: {
      announcements: [
        {
          created_at: '2026-04-17T08:00:00Z',
          expire_at: '2030-03-17T17:46:40Z',
          markets: [{ address: '0x1111111111111111111111111111111111111111' }],
        },
      ],
    },
  };

  assert.deepEqual(extractAnnouncements(response), response.data?.announcements);
});

test('returns empty array for non-200 wrapped response', () => {
  const response: AnnouncementsApiResponse = {
    code: 50001,
    msg: 'failed to load announcements',
    data: {
      announcements: [
        {
          created_at: '2026-04-17T08:00:00Z',
          expire_at: '2030-03-17T17:46:40Z',
          markets: [{ address: '0x1111111111111111111111111111111111111111' }],
        },
      ],
    },
  };

  assert.deepEqual(extractAnnouncements(response), []);
});

test('returns empty array when wrapped data has no announcements array', () => {
  const response: AnnouncementsApiResponse = {
    code: 200,
    msg: '',
    data: {},
  };

  assert.deepEqual(extractAnnouncements(response), []);
});
