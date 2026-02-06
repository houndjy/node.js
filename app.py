from __future__ import annotations

import threading
import tkinter as tk
from tkinter import messagebox, ttk
import webbrowser

from crawler import crawl_articles
from grouping import cluster_articles


class NewsCrawlerApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("김태년 기사 크롤러")
        self.root.geometry("1600x1000")

        self._build_ui()

    def _build_ui(self) -> None:
        container = ttk.Frame(self.root, padding=12)
        container.pack(fill=tk.BOTH, expand=True)

        top = ttk.Frame(container)
        top.pack(fill=tk.X)

        ttk.Label(top, text="검색어").pack(side=tk.LEFT)
        self.keyword_var = tk.StringVar(value="김태년")
        keyword_entry = ttk.Entry(top, textvariable=self.keyword_var, width=30)
        keyword_entry.pack(side=tk.LEFT, padx=8)

        ttk.Label(top, text="페이지 수").pack(side=tk.LEFT)
        self.pages_var = tk.IntVar(value=3)
        pages_spin = ttk.Spinbox(top, from_=1, to=20, textvariable=self.pages_var, width=5)
        pages_spin.pack(side=tk.LEFT, padx=8)

        self.fetch_btn = ttk.Button(top, text="크롤링 실행", command=self.fetch_news)
        self.fetch_btn.pack(side=tk.LEFT, padx=8)

        self.status_var = tk.StringVar(value="대기 중")
        ttk.Label(top, textvariable=self.status_var).pack(side=tk.LEFT, padx=16)

        cols = ("date", "title", "count", "sources", "link")
        self.tree = ttk.Treeview(container, columns=cols, show="headings", height=35)
        self.tree.pack(fill=tk.BOTH, expand=True, pady=(12, 0))

        self.tree.heading("date", text="대표 일자")
        self.tree.heading("title", text="묶인 기사 대표 제목")
        self.tree.heading("count", text="기사 수")
        self.tree.heading("sources", text="언론사")
        self.tree.heading("link", text="대표 링크")

        self.tree.column("date", width=130, anchor=tk.CENTER)
        self.tree.column("title", width=630)
        self.tree.column("count", width=80, anchor=tk.CENTER)
        self.tree.column("sources", width=250)
        self.tree.column("link", width=440)

        self.tree.bind("<Double-1>", self.open_link)

    def fetch_news(self) -> None:
        self.fetch_btn.config(state=tk.DISABLED)
        self.status_var.set("크롤링 중...")

        def worker() -> None:
            try:
                keyword = self.keyword_var.get().strip() or "김태년"
                pages = max(1, min(20, int(self.pages_var.get())))
                articles = crawl_articles(keyword=keyword, pages=pages)
                clusters = cluster_articles(articles)
                self.root.after(0, lambda: self.populate(clusters))
            except Exception as exc:  # noqa: BLE001
                self.root.after(0, lambda: self.show_error(exc))
            finally:
                self.root.after(0, self._done_fetch)

        threading.Thread(target=worker, daemon=True).start()

    def populate(self, clusters) -> None:
        for row in self.tree.get_children():
            self.tree.delete(row)

        for cluster in clusters:
            primary = cluster.articles[0]
            sources = ", ".join(sorted({a.source for a in cluster.articles}))
            self.tree.insert(
                "",
                tk.END,
                values=(
                    cluster.representative_date.isoformat(),
                    cluster.representative_title,
                    len(cluster.articles),
                    sources,
                    primary.url,
                ),
            )

        self.status_var.set(f"완료: {len(clusters)}개 항목")

    def _done_fetch(self) -> None:
        self.fetch_btn.config(state=tk.NORMAL)

    def show_error(self, error: Exception) -> None:
        self.status_var.set("오류 발생")
        messagebox.showerror("실패", f"크롤링 중 오류가 발생했습니다.\n{error}")

    def open_link(self, _event) -> None:
        row_id = self.tree.focus()
        if not row_id:
            return
        values = self.tree.item(row_id, "values")
        if len(values) >= 5 and values[4]:
            webbrowser.open(values[4])


if __name__ == "__main__":
    root = tk.Tk()
    app = NewsCrawlerApp(root)
    root.mainloop()
