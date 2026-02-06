from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
import html
import re
from typing import List
from urllib.parse import quote
from urllib.request import Request, urlopen


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)


@dataclass
class Article:
    title: str
    url: str
    source: str
    published_date: date


def _parse_date(raw: str, base_date: date) -> date:
    text = raw.strip().lower()

    if "시간" in text:
        return base_date

    day_match = re.search(r"(\d+)\s*일\s*전", text)
    if day_match:
        return base_date - timedelta(days=int(day_match.group(1)))

    if "어제" in text:
        return base_date - timedelta(days=1)

    date_match = re.search(r"(\d{4})\.(\d{1,2})\.(\d{1,2})", text)
    if date_match:
        y, m, d = map(int, date_match.groups())
        return date(y, m, d)

    date_match_dash = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", text)
    if date_match_dash:
        y, m, d = map(int, date_match_dash.groups())
        return date(y, m, d)

    return base_date


def _strip_tags(raw: str) -> str:
    no_tag = re.sub(r"<[^>]+>", "", raw)
    return html.unescape(no_tag).strip()


def crawl_articles(keyword: str = "김태년", pages: int = 3, timeout: int = 15) -> List[Article]:
    """Crawl Naver news search pages for the given keyword without third-party deps."""
    articles: List[Article] = []
    today = datetime.now().date()

    for page in range(pages):
        start = page * 10 + 1
        url = (
            "https://search.naver.com/search.naver?where=news"
            f"&query={quote(keyword)}&sort=1&start={start}"
        )
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=timeout) as response:
            page_html = response.read().decode("utf-8", errors="ignore")

        blocks = re.findall(r'<li class="bx[\s\S]*?</li>', page_html)
        for block in blocks:
            title_match = re.search(r'<a[^>]*class="news_tit"[^>]*>', block)
            if not title_match:
                continue

            tag = title_match.group(0)
            href_match = re.search(r'href="([^"]+)"', tag)
            title_attr_match = re.search(r'title="([^"]+)"', tag)
            text_match = re.search(r'class="news_tit"[^>]*>(.*?)</a>', block, re.S)

            url_val = html.unescape(href_match.group(1)).strip() if href_match else ""
            title_val = (
                html.unescape(title_attr_match.group(1)).strip()
                if title_attr_match
                else _strip_tags(text_match.group(1)) if text_match else ""
            )

            info_tags = re.findall(r'<span class="info">(.*?)</span>', block, re.S)
            raw_date = _strip_tags(info_tags[-1]) if info_tags else ""
            published_date = _parse_date(raw_date, today)

            press_match = re.search(r'<a[^>]*class="info press"[^>]*>(.*?)</a>', block, re.S)
            source = _strip_tags(press_match.group(1)) if press_match else "미상"

            if title_val and url_val:
                articles.append(
                    Article(
                        title=title_val,
                        url=url_val,
                        source=source,
                        published_date=published_date,
                    )
                )

    dedup = {}
    for article in articles:
        dedup[article.url] = article
    return list(dedup.values())
