const result = document.getElementById('result');
const form = document.getElementById('searchForm');

function addDays(date, days) {
  const copied = new Date(date);
  copied.setDate(copied.getDate() + days);
  return copied;
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

const today = new Date();
document.getElementById('to').value = formatDateInput(today);
document.getElementById('from').value = formatDateInput(addDays(today, -30));

function articleItem(article) {
  const d = new Date(article.publishedAt).toLocaleString('ko-KR', { hour12: false });
  return `<li><a href="${article.url}" target="_blank" rel="noreferrer">${article.title}</a> <span class="meta">(${article.source}, ${d})</span></li>`;
}

function render(data) {
  if (!data.length) {
    result.innerHTML = '<p>검색 결과가 없습니다.</p>';
    return;
  }

  result.innerHTML = data
    .map((yearGroup) => {
      const monthBlocks = yearGroup.months
        .map((monthGroup) => {
          const dayBlocks = monthGroup.days
            .map((dayGroup) => {
              const clusterCards = dayGroup.clusters
                .map((cluster) => {
                  const representative = cluster.items[0];
                  return `
                    <article class="card">
                      <h4>${representative.title}</h4>
                      <p class="meta">${cluster.count}건 묶음 · ${new Date(
                        representative.publishedAt,
                      ).toLocaleString('ko-KR', { hour12: false })}</p>
                      <details>
                        <summary>개별 기사 보기</summary>
                        <ul>
                          ${cluster.items.map(articleItem).join('')}
                        </ul>
                      </details>
                    </article>
                  `;
                })
                .join('');

              return `<section><h3>${dayGroup.day}일</h3>${clusterCards}</section>`;
            })
            .join('');

          return `<section><h2>${monthGroup.month}월</h2>${dayBlocks}</section>`;
        })
        .join('');

      return `<section><h1>${yearGroup.year}년</h1>${monthBlocks}</section>`;
    })
    .join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const params = new URLSearchParams({
    query: document.getElementById('query').value,
    from: document.getElementById('from').value,
    to: document.getElementById('to').value,
  });

  result.innerHTML = '<p>검색 중...</p>';

  const response = await fetch(`/api/news?${params.toString()}`);
  if (!response.ok) {
    const message = await response.text();
    result.innerHTML = `<p>오류: ${message}</p>`;
    return;
  }

  const payload = await response.json();
  render(payload.data);
});
