import type { ResolutionString } from '@/lib/charting_library/charting_library';

// justify whether is same period
export const inSamePeriod = (
  resolution: ResolutionString,
  timestamp1: number, // second
  timestamp2: number, // second
) => {
  let interval;
  let unit = 'S';
  const offsetInSeconds = new Date().getTimezoneOffset() * 60;
  const finalTs1 = timestamp1 - offsetInSeconds;
  const finalTs2 = timestamp2 - offsetInSeconds;
  if (resolution.endsWith('S')) {
    interval = +resolution.replace('S', '');
  } else if (resolution.endsWith('D')) {
    interval = +resolution.replace('D', '') * 24 * 60 * 60;
  } else if (resolution.endsWith('W')) {
    interval = +resolution.replace('W', '') * 7 * 24 * 60 * 60;
  } else if (resolution.endsWith('M')) {
    interval = +resolution.replace('M', '');
    unit = 'M';
  } else if (resolution.endsWith('Y')) {
    interval = +resolution.replace('Y', '');
    unit = 'Y';
  } else {
    interval = +resolution * 60;
  }

  if (unit === 'S') {
    return Math.floor(finalTs1 / interval) === Math.floor(finalTs2 / interval);
  }

  if (unit === 'M') {
    const month1 = new Date(finalTs1 * 1000).getMonth();
    const month2 = new Date(finalTs2 * 1000).getMonth();
    return Math.floor(month1 / interval) === Math.floor(month2 / interval);
  }

  if (unit === 'Y') {
    const year1 = new Date(finalTs1 * 1000).getFullYear();
    const year2 = new Date(finalTs2 * 1000).getFullYear();
    return Math.floor(year1 / interval) === Math.floor(year2 / interval);
  }
};
