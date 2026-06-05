document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 선택
    const checkboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    const cards = document.querySelectorAll('.card');
    const resetBtn = document.querySelector('.filter-reset');
    const searchInput = document.querySelector('.search-input');
    const unitCount = document.getElementById('unit-count');

    // 화면에 보이는 카드 개수 업데이트 함수
    function updateUnitCount() {
        if (unitCount) {
            unitCount.textContent = Array.from(cards).filter(c => c.style.display !== 'none').length;
        }
    }

    // 필터 및 검색 통합 처리 함수
    function applyFilterAndSearch() {
        // 체크된 필터 값 추출
        const selected = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.dataset.filter);
        // 검색어 공백 제거 및 소문자화
        const query = searchInput ? searchInput.value.toLowerCase().replace(/\s+/g, '').trim() : '';

        // 각 카드의 노출 여부 결정
        cards.forEach(card => {
            const cardText = card.textContent.toLowerCase().replace(/\s+/g, '');
            const matchesFilter = selected.every(f => cardText.includes(f));
            const matchesSearch = cardText.includes(query);

            // 필터와 검색 조건을 모두 만족해야 표시
            card.style.display = matchesFilter && matchesSearch ? '' : 'none';
        });
        updateUnitCount();
    }

    // 이벤트 리스너 등록 (체크박스 변경 및 검색어 입력 시)
    checkboxes.forEach(cb => cb.addEventListener('change', applyFilterAndSearch));
    if (searchInput) searchInput.addEventListener('input', applyFilterAndSearch);

    // 초기화 버튼 클릭 이벤트
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            checkboxes.forEach(cb => cb.checked = false); // 체크박스 해제
            if (searchInput) searchInput.value = '';       // 검색어 초기화
            cards.forEach(card => card.style.display = ''); // 모든 카드 표시
            updateUnitCount();
        });
    }
});