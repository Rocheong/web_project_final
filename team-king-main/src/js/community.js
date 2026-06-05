const ITEMS_PER_PAGE = 7;

// 게시판 데이터
const data = {
    notice: [],
    qna: [],
    contact: []
};

// 현재 상태 관리
let currentTab = 'notice';
let currentPage = { notice: 1, qna: 1, contact: 1 };
let currentFilter = { qna: '전체', contact: '전체' };
let currentDetail = null;
let writeTarget = null;

// 탭 전환
function sw(tab, el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    currentTab = tab;
    currentDetail = null;
    render();
}

// 필터 적용된 게시글 목록 반환
function getFilteredItems(tab) {
    let items = [...data[tab]];
    if (tab === 'qna') {
        const f = currentFilter.qna;
        if (f === '답변 완료') items = items.filter(i => i.badgeLabel === '답변 완료');
        else if (f === '미답변')  items = items.filter(i => i.badgeLabel === '미답변');
    }
    return items;
}

// 메인 렌더링
function render() {
    // 상세 페이지면 상세 렌더링으로 전환
    if (currentDetail) { renderDetail(); return; }
    const tab = currentTab;
    const main = document.getElementById('main-area');

    const items = getFilteredItems(tab);
    const total = items.length;
    const page = currentPage[tab];
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

    // 현재 페이지에 보여줄 게시글만 자르기
    const paged = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // notice는 작성자 표시 안 함
    const showAuthor = tab !== 'notice';
    let html = '';

    // qna 필터 + 질문 작성 버튼
    if (tab === 'qna') {
        const chips = ['전체', '답변 완료', '미답변'];
        html += `
        <div class="filter-header">
            <div class="filter-bar">
                ${chips.map(c =>
                    `<button class="chip ${currentFilter.qna === c ? 'on' : ''}" onclick="setFilter('qna','${c}')">${c}</button>`
                ).join('')}
            </div>
            <button class="btn btn-primary" onclick="openModal()">+ 질문 작성</button>
        </div>`;
    }

    // contact 글 작성 버튼
    if (tab === 'contact') {
        html += `
        <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
            <button class="btn btn-primary" onclick="openModal()">+ 글 작성</button>
        </div>`;
    }

    html += `<table><tbody>`;

    // 게시글 없을 때
    if (paged.length === 0) {
        html += `<tr><td colspan="2" style="text-align:center;padding:3rem;color:#AFA9EC">게시글이 없습니다.</td></tr>`;
    } else {
        // 게시글 한 줄씩 렌더링
        paged.forEach((item, idx) => {
            // 고정 글은 번호 대신 — 표시
            const num = item.badge === 'b-pinned' ? '—' : total - ((page - 1) * ITEMS_PER_PAGE + idx);
            const commentCount = item.comments ? item.comments.length : 0;
            html += `<tr class="has-item" onclick="openDetail('${tab}',${item.id})">
            <td class="col-n">${num}</td>
            <td>
                <div class="post-title">
                    ${item.badge ? `<span class="badge ${item.badge}">${item.badgeLabel}</span>` : ''}
                    ${item.title}${commentCount > 0 ? ` <span style="color:#7F77DD;font-size:11px">[${commentCount}]</span>` : ''}
                </div>
                <div class="col-d">${item.date}${showAuthor ? ` · 작성자: ${item.author || '관리자'}` : ''} · 조회: ${(item.views || 0).toLocaleString()}</div>
            </td>
            </tr>`;
        });
    }

    html += `</tbody></table>`;

    // 페이지네이션
    html += `<div class="pager">
        <div class="pb ${page === 1 ? 'disabled' : ''}" onclick="goPage(${page - 1})">&#8249;</div>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<div class="pb ${i === page ? 'cur' : ''}" onclick="goPage(${i})">${i}</div>`;
    }
    html += `<div class="pb ${page === totalPages ? 'disabled' : ''}" onclick="goPage(${page + 1})">&#8250;</div>
    </div>`;

    main.innerHTML = html;
}

// 게시글 상세 페이지 열기
function openDetail(tab, id) {
    const item = data[tab].find(i => i.id === id);
    if (!item) return;
    item.views = (item.views || 0) + 1; // 조회수 증가
    currentDetail = { tab, id };
    renderDetail();
}

// 상세 페이지 렌더링
function renderDetail() {
    const { tab, id } = currentDetail;
    const item = data[tab].find(i => i.id === id);
    const main = document.getElementById('main-area');
    const showAuthor = tab !== 'notice';
    const isPrivate = tab === 'contact'; // 공유 게시판은 작성자 비공개

    let html = `<div class="detail-back" onclick="closeDetail()">← 목록으로 돌아가기</div>
    <div class="detail-header">
        <div><span class="badge ${item.badge}">${item.badgeLabel}</span></div>
        <div class="detail-title">${item.title}</div>
        <div class="detail-meta">
            ${showAuthor ? `<span>작성자: ${isPrivate ? '비공개' : item.author}</span>` : ''}
            <span>날짜: ${item.date}</span>
            ${tab !== 'contact' ? `<span>조회수: ${(item.views || 0).toLocaleString()}</span>` : ''}
        </div>
    </div>
    <div class="detail-body">${item.body}</div>
    <div class="comment-title">댓글 ${item.comments.length}개</div>`;

    // 댓글 목록 렌더링
    item.comments.forEach(c => {
        html += `<div class="comment-item">
            <div class="comment-author">${c.author}</div>
            <div class="comment-text">${c.text}</div>
        </div>`;
    });

    // 댓글 입력창
    html += `<div class="comment-input-row">
        <input type="text" id="comment-input" placeholder="댓글을 입력하세요" onkeydown="if(event.key==='Enter')addComment('${tab}',${id})" />
        <button class="btn btn-primary" onclick="addComment('${tab}',${id})">등록</button>
    </div>`;

    main.innerHTML = html;
}

// 상세 페이지 닫고 목록으로 돌아가기
function closeDetail() {
    currentDetail = null;
    render();
}

// 댓글 등록
function addComment(tab, id) {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;
    const item = data[tab].find(i => i.id === id);
    item.comments.push({ author: '나', text });
    renderDetail();
}

// 필터 변경
function setFilter(tab, val) {
    currentFilter[tab] = val;
    currentPage[tab] = 1;
    render();
}

// 페이지 이동
function goPage(p) {
    const tab = currentTab;
    const items = getFilteredItems(tab);
    const total = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    if (p < 1 || p > total) return;
    currentPage[tab] = p;
    render();
}

// 글 작성 모달 열기
function openModal() {
    writeTarget = currentTab;
    document.getElementById('modal-title').textContent = currentTab === 'qna' ? '질문 작성' : '글 작성';
    document.getElementById('form-title').value = '';
    document.getElementById('form-body').value = '';
    document.getElementById('write-modal').classList.add('open');
}

// 글 작성 모달 닫기
function closeModal() {
    document.getElementById('write-modal').classList.remove('open');
}

// 글 등록
function submitPost() {
    const title = document.getElementById('form-title').value.trim();
    const body = document.getElementById('form-body').value.trim();
    if (!title || !body) { alert('제목과 내용을 입력해주세요.'); return; }

    const tab = writeTarget;
    // 새 id는 기존 최대 id + 1
    const newId = data[tab].length > 0 ? Math.max(...data[tab].map(i => i.id)) + 1 : 1;
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;

    data[tab].unshift({
        id: newId,
        badge: tab === 'qna' ? 'b-new' : '',
        badgeLabel: tab === 'qna' ? '미답변' : '',
        title,
        body,
        author: '나',
        date: dateStr,
        views: 0,
        comments: []
    });

    closeModal();
    currentPage[tab] = 1;
    render();
}

// 모달 바깥 클릭 시 닫기
document.getElementById('write-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// 최초 렌더링
render();
