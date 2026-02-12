# 한국 뉴스 검색/그룹화 프로그램 구성안 (Node.js)

요구사항 반영:
1. 한국 뉴스만 검색
2. 1년 단위 표출
3. 한달 단위 묶음
4. 일단위 묶음
5. 제목 80% 이상 유사 시 1개 항목으로 묶기
5-1. 클릭 시 개별 기사 확장 보기
6. 최신순(내림차순) 정렬

## 실행 방법

```bash
npm start
```

> `NEWS_API_KEY` 환경변수가 필요합니다. (newsapi.org 기준)

예시:

```bash
NEWS_API_KEY=your_key npm start
```

브라우저에서 `http://localhost:3000` 접속 후 검색하면 됩니다.

## 구조

- `src/newsProvider.js`
  - 한국어(`language=ko`) + 한국 주요 언론사 도메인 필터 기반으로 뉴스 검색.
- `src/newsAggregator.js`
  - 제목 정규화 + bigram Dice 계수로 유사도 계산.
  - 유사도 0.8 이상이면 같은 클러스터로 묶음.
  - 연/월/일 계층 구조로 그룹화하고 최신순 정렬.
- `src/server.js`
  - `/api/news` API 제공.
  - 정적 프론트 페이지 서빙.
- `public/main.js`
  - 연/월/일 + 클러스터 UI 렌더링.
  - `<details>`를 사용해 클릭 시 개별 기사 확장.

## API 예시

`GET /api/news?query=AI&from=2026-01-01&to=2026-02-01`

응답:

```json
{
  "count": 42,
  "data": [
    {
      "year": "2026",
      "months": [
        {
          "month": "02",
          "days": [
            {
              "day": "12",
              "clusters": [
                {
                  "representativeTitle": "...",
                  "similarityThreshold": 0.8,
                  "count": 3,
                  "items": [{ "title": "..." }]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```
