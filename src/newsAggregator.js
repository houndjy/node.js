const TITLE_SIMILARITY_THRESHOLD = 0.8;

export function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeBigrams(text) {
  const clean = normalizeTitle(text).replace(/\s/g, '');
  if (clean.length < 2) return new Set([clean]);

  const result = new Set();
  for (let i = 0; i < clean.length - 1; i += 1) {
    result.add(clean.slice(i, i + 2));
  }
  return result;
}

export function titleSimilarity(a, b) {
  const left = makeBigrams(a);
  const right = makeBigrams(b);

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }

  const denominator = left.size + right.size;
  if (denominator === 0) return 1;
  return (2 * intersection) / denominator;
}

export function clusterArticlesByTitle(articles, threshold = TITLE_SIMILARITY_THRESHOLD) {
  const clusters = [];

  for (const article of articles) {
    const matchingCluster = clusters.find((cluster) =>
      titleSimilarity(cluster.representative.title, article.title) >= threshold
    );

    if (!matchingCluster) {
      clusters.push({
        representative: article,
        items: [article],
      });
      continue;
    }

    matchingCluster.items.push(article);
  }

  return clusters
    .map((cluster) => ({
      representativeTitle: cluster.representative.title,
      similarityThreshold: threshold,
      count: cluster.items.length,
      items: cluster.items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
    }))
    .sort((a, b) => Date.parse(b.items[0].publishedAt) - Date.parse(a.items[0].publishedAt));
}

function getDateParts(isoString) {
  const dt = new Date(isoString);
  const year = `${dt.getUTCFullYear()}`;
  const month = `${dt.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${dt.getUTCDate()}`.padStart(2, '0');
  return { year, month, day };
}

export function groupNewsHierarchy(articles, threshold = TITLE_SIMILARITY_THRESHOLD) {
  const sorted = [...articles].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const years = new Map();

  for (const article of sorted) {
    const { year, month, day } = getDateParts(article.publishedAt);
    if (!years.has(year)) years.set(year, new Map());
    const months = years.get(year);
    if (!months.has(month)) months.set(month, new Map());
    const days = months.get(month);
    if (!days.has(day)) days.set(day, []);
    days.get(day).push(article);
  }

  return [...years.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([month, days]) => ({
          month,
          days: [...days.entries()]
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([day, dayArticles]) => ({
              day,
              clusters: clusterArticlesByTitle(dayArticles, threshold),
            })),
        })),
    }));
}
