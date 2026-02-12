import test from 'node:test';
import assert from 'node:assert/strict';
import { groupNewsHierarchy, titleSimilarity } from '../src/newsAggregator.js';

test('titleSimilarity should be high for near-identical titles', () => {
  const a = '[속보] 삼성전자, AI 반도체 투자 확대';
  const b = '삼성전자 AI 반도체 투자 확대';
  assert.ok(titleSimilarity(a, b) >= 0.8);
});

test('groupNewsHierarchy should group by year/month/day and cluster similar titles', () => {
  const articles = [
    {
      title: '삼성전자 AI 반도체 투자 확대',
      url: 'https://example.com/1',
      source: 'A',
      publishedAt: '2026-02-12T09:00:00Z',
    },
    {
      title: '[속보] 삼성전자 AI 반도체 투자 확대',
      url: 'https://example.com/2',
      source: 'B',
      publishedAt: '2026-02-12T08:00:00Z',
    },
    {
      title: '네이버, 신규 검색 기능 공개',
      url: 'https://example.com/3',
      source: 'C',
      publishedAt: '2026-01-10T09:00:00Z',
    },
  ];

  const grouped = groupNewsHierarchy(articles, 0.8);

  assert.equal(grouped[0].year, '2026');
  assert.equal(grouped[0].months[0].month, '02');
  assert.equal(grouped[0].months[0].days[0].day, '12');
  assert.equal(grouped[0].months[0].days[0].clusters.length, 1);
  assert.equal(grouped[0].months[0].days[0].clusters[0].count, 2);
});
