document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
    const cards = document.querySelectorAll('.card');
    const resetBtn = document.querySelector('.filter-reset');
    const searchInput = document.querySelector('.search-input');

    // 1. [필터 기능] 체크박스 전용 함수
    function filterCards() {
        // 현재 체크된 모든 필터 텍스트 가져오기 (공백 제거)
        const selected = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.parentElement.textContent.replace(/\s+/g, '').trim());

        cards.forEach(card => {
            if (selected.length === 0) {
                card.style.display = '';
                return;
            }

            // 카드의 텍스트 내용 추출 (공백 제거)
            const cardText = card.textContent.replace(/\s+/g, '');
            
            // 모든 선택된 필터가 카드에 포함되어 있는지 확인 (AND 조건)
            const isMatch = selected.every(f => cardText.includes(f));
            card.style.display = isMatch ? '' : 'none';
        });
    }

    // 2. [검색 기능] 검색창 전용 함수 (필터와 무관하게 독립 작동)
    function searchCards() {
        const query = searchInput.value.toLowerCase().replace(/\s+/g, '').trim();

        cards.forEach(card => {
            const cardText = card.textContent.toLowerCase().replace(/\s+/g, '');
            
            if (cardText.includes(query)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // 3. 이벤트 연결
    checkboxes.forEach(cb => {
        cb.addEventListener('change', filterCards);
    });

    if (searchInput) {
        searchInput.addEventListener('input', searchCards);
    }

    // 4. 초기화 버튼 클릭 시 전체 카드 리셋
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            checkboxes.forEach(cb => {
                cb.checked = false;
            });
            
            if (searchInput) {
                searchInput.value = '';
            }
            
            cards.forEach(card => {
                card.style.display = '';
            });
        });
    }
});