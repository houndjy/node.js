const form = document.getElementById('search-form');
const queryInput = document.getElementById('query');
const statusBox = document.getElementById('status');
const resultsBox = document.getElementById('results');

function renderResults(payload) {
  resultsBox.innerHTML = '';

  for (const monthData of payload.data) {
    const monthPanel = document.createElement('details');
    monthPanel.className = 'month-panel';

    const monthSummary = document.createElement('summary');
    monthSummary.textContent = `${monthData.month} (${monthData.groups.length}개 묶음)`;
    monthPanel.appendChild(monthSummary);

    const groupsContainer = document.createElement('div');
    groupsContainer.className = 'groups';

    if (monthData.groups.length === 0) {
      groupsContainer.textContent = '검색 결과가 없습니다.';
    } else {
      monthData.groups.forEach((group, groupIndex) => {
        const groupDetails = document.createElement('details');
        groupDetails.className = 'group';
        if (groupIndex === 0) {
          groupDetails.open = true;
        }

        const groupSummary = document.createElement('summary');
        groupSummary.textContent = `${group.representativeTitle} (${group.items.length}건)`;
        groupDetails.appendChild(groupSummary);

        const list = document.createElement('ul');

        group.items.forEach((item) => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
            <div class="meta">${item.source} · ${new Date(item.pubDate).toLocaleString('ko-KR')}</div>`;
          list.appendChild(listItem);
        });

        groupDetails.appendChild(list);
        groupsContainer.appendChild(groupDetails);
      });
    }

    monthPanel.appendChild(groupsContainer);
    resultsBox.appendChild(monthPanel);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = queryInput.value.trim();

  if (!query) {
    statusBox.textContent = '검색어를 입력해 주세요.';
    return;
  }

  statusBox.textContent = '검색 중입니다...';
  resultsBox.innerHTML = '';

  try {
    const response = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('검색 API 호출에 실패했습니다.');
    }

    const payload = await response.json();
    statusBox.textContent = `"${payload.query}" 검색 결과`;
    renderResults(payload);
  } catch (error) {
    statusBox.textContent = `오류: ${error.message}`;
  }
});
