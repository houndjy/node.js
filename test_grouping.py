from datetime import date
import unittest

from crawler import Article
from grouping import cluster_articles


class GroupingTests(unittest.TestCase):
    def test_same_day_similar_titles_grouped(self):
        articles = [
            Article("김태년, 예산안 처리 촉구", "u1", "A", date(2026, 2, 1)),
            Article("김태년 예산안 처리 촉구", "u2", "B", date(2026, 2, 1)),
        ]
        clusters = cluster_articles(articles)
        self.assertEqual(len(clusters), 1)
        self.assertEqual(len(clusters[0].articles), 2)

    def test_cross_day_90_percent_similarity_grouped(self):
        articles = [
            Article("김태년 예산안 통과 필요", "u1", "A", date(2026, 2, 1)),
            Article("김태년 예산안 통과 필요", "u2", "B", date(2026, 2, 3)),
        ]
        clusters = cluster_articles(articles)
        self.assertEqual(len(clusters), 1)
        self.assertEqual(len(clusters[0].articles), 2)

    def test_cross_day_more_than_two_days_not_grouped(self):
        articles = [
            Article("김태년 예산안 통과 필요", "u1", "A", date(2026, 2, 1)),
            Article("김태년 예산안 통과 필요", "u2", "B", date(2026, 2, 4)),
        ]
        clusters = cluster_articles(articles)
        self.assertEqual(len(clusters), 2)


if __name__ == "__main__":
    unittest.main()
