function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function monthLabel(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function escapeXml(text) {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&#39;', "'")
    .replaceAll('&quot;', '"');
}

function parseRssItems(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const chunk = match[1];
    const title = /<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(chunk)?.[1] ??
      /<title>(.*?)<\/title>/.exec(chunk)?.[1] ??
      '제목 없음';
    const link = /<link>(.*?)<\/link>/.exec(chunk)?.[1] ?? '#';
    const pubDate = /<pubDate>(.*?)<\/pubDate>/.exec(chunk)?.[1] ?? '';
    const source = /<source[^>]*>(.*?)<\/source>/.exec(chunk)?.[1] ?? '출처 미상';

    items.push({
      title: escapeXml(title.trim()),
      link: link.trim(),
      pubDate: pubDate.trim(),
      source: escapeXml(source.trim())
    });
  }

  return items;
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[\[\]"'“”‘’]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);

  for (let j = 1; j <= b.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function titleSimilarity(a, b) {
  if (!a || !b) {
    return 0;
  }

  const normalizedA = normalizeTitle(a);
  const normalizedB = normalizeTitle(b);

  if (!normalizedA || !normalizedB) {
    return 0;
  }

  if (normalizedA === normalizedB) {
    return 1;
  }

  const distance = levenshteinDistance(normalizedA, normalizedB);
  const maxLen = Math.max(normalizedA.length, normalizedB.length);

  return 1 - (distance / maxLen);
}

function groupBySimilarTitle(items, threshold = 0.85) {
  const groups = [];

  for (const item of items) {
    let matched = false;

    for (const group of groups) {
      const score = titleSimilarity(item.title, group.representativeTitle);
      if (score >= threshold) {
        group.items.push(item);
        if (new Date(item.pubDate) < new Date(group.firstPublished)) {
          group.firstPublished = item.pubDate;
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({
        representativeTitle: item.title,
        firstPublished: item.pubDate,
        items: [item]
      });
    }
  }

  return groups.sort((a, b) => new Date(b.firstPublished) - new Date(a.firstPublished));
}

function buildMonthlyRanges(monthCount = 12) {
  const now = new Date();
  const ranges = [];

  for (let i = 0; i < monthCount; i += 1) {
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);

    ranges.push({
      label: monthLabel(start),
      from: formatDate(start),
      to: formatDate(end)
    });
  }

  return ranges;
}

async function fetchMonthNews(query, range) {
  const composedQuery = `${query} after:${range.from} before:${range.to} lang:ko`;
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(composedQuery)}&hl=ko&gl=KR&ceid=KR:ko`;

  const response = await fetch(rssUrl);
  if (!response.ok) {
    throw new Error(`Google News RSS 요청 실패: ${response.status}`);
  }

  const xml = await response.text();
  const items = parseRssItems(xml).map((item) => ({ ...item, month: range.label }));

  return groupBySimilarTitle(items, 0.85);
}

export async function getYearlyNewsTimeline(query) {
  if (!query?.trim()) {
    throw new Error('검색어가 필요합니다.');
  }

  const ranges = buildMonthlyRanges(12);
  const results = [];

  for (const range of ranges) {
    const groups = await fetchMonthNews(query.trim(), range);
    results.push({
      month: range.label,
      range,
      groups
    });
  }

  return results;
}

export { buildMonthlyRanges, groupBySimilarTitle, titleSimilarity, normalizeTitle };
