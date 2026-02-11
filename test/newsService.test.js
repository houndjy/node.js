import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthlyRanges, groupBySimilarTitle, titleSimilarity } from '../src/newsService.js';

test('buildMonthlyRanges returns 12 contiguous months', () => {
  const ranges = buildMonthlyRanges(12);
  assert.equal(ranges.length, 12);
  assert.match(ranges[0].label, /^\d{4}-\d{2}$/);
  assert.match(ranges[11].label, /^\d{4}-\d{2}$/);
});

test('titleSimilarity identifies similar Korean titles', () => {
  const score = titleSimilarity('삼성전자 실적 발표', '삼성전자 실적발표');
  assert.ok(score >= 0.85);
});

test('groupBySimilarTitle merges highly similar titles', () => {
  const items = [
    { title: '현대차 전기차 판매 급증', pubDate: '2026-02-01T00:00:00Z' },
    { title: '현대차 전기차 판매  급증', pubDate: '2026-02-01T01:00:00Z' },
    { title: '기아차 신차 출시', pubDate: '2026-02-01T02:00:00Z' }
  ];

  const groups = groupBySimilarTitle(items, 0.85);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].items.length, 1);
  assert.equal(groups[1].items.length, 2);
});
