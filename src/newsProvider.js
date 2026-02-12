const KOREAN_NEWS_DOMAINS = [
  'yna.co.kr',
  'newsis.com',
  'chosun.com',
  'joongang.co.kr',
  'hani.co.kr',
  'khan.co.kr',
  'mk.co.kr',
  'sedaily.com',
  'dt.co.kr',
  'zdnet.co.kr',
  'etnews.com',
  'ytn.co.kr',
  'kbs.co.kr',
  'mbc.co.kr',
  'sbs.co.kr',
];

function buildDomainQuery() {
  return KOREAN_NEWS_DOMAINS.map((domain) => `domains=${encodeURIComponent(domain)}`).join('&');
}

export async function fetchKoreanNews({ query, from, to, pageSize = 100 }) {
  if (!process.env.NEWS_API_KEY) {
    throw new Error('NEWS_API_KEY 환경변수가 필요합니다.');
  }

  const encodedQuery = encodeURIComponent(query);
  const domainQuery = buildDomainQuery();
  const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=ko&sortBy=publishedAt&pageSize=${pageSize}&from=${from}&to=${to}&${domainQuery}`;

  const response = await fetch(url, {
    headers: {
      'X-Api-Key': process.env.NEWS_API_KEY,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`뉴스 API 호출 실패 (${response.status}): ${message}`);
  }

  const payload = await response.json();
  return payload.articles
    .filter((article) => article.title && article.url && article.publishedAt)
    .map((article) => ({
      title: article.title,
      url: article.url,
      source: article.source?.name ?? 'unknown',
      publishedAt: article.publishedAt,
      description: article.description ?? '',
    }));
}
