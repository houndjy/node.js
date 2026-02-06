from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from difflib import SequenceMatcher
from typing import Iterable, List

from crawler import Article


@dataclass
class ArticleCluster:
    representative_title: str
    representative_date: date
    articles: List[Article] = field(default_factory=list)


def title_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.strip().lower(), b.strip().lower()).ratio()


def cluster_articles(
    articles: Iterable[Article],
    same_day_threshold: float = 0.82,
    cross_day_threshold: float = 0.90,
) -> List[ArticleCluster]:
    sorted_articles = sorted(articles, key=lambda x: (x.published_date, x.title))
    clusters: List[ArticleCluster] = []

    for article in sorted_articles:
        best_idx = -1
        best_score = 0.0

        for idx, cluster in enumerate(clusters):
            day_diff = abs((article.published_date - cluster.representative_date).days)
            score = title_similarity(article.title, cluster.representative_title)

            if day_diff == 0 and score >= same_day_threshold and score > best_score:
                best_idx = idx
                best_score = score
            elif day_diff <= 2 and score >= cross_day_threshold and score > best_score:
                best_idx = idx
                best_score = score

        if best_idx >= 0:
            clusters[best_idx].articles.append(article)
        else:
            clusters.append(
                ArticleCluster(
                    representative_title=article.title,
                    representative_date=article.published_date,
                    articles=[article],
                )
            )

    for cluster in clusters:
        cluster.articles.sort(key=lambda a: (a.published_date, a.source))

    clusters.sort(key=lambda c: (c.representative_date, -len(c.articles)), reverse=True)
    return clusters
