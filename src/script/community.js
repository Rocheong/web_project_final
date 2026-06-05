const ITEMS_PER_PAGE = 7;
const STORAGE_KEY = 'studeo_board_data';

// localStorage에서 게시판 데이터를 불러옴
const loadData = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || { notice: [], qna: [], contact: [] };

// 현재 게시판 데이터를 localStorage에 저장
const saveData = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const data = loadData();

let currentTab = 'notice';
let currentPage = { notice: 1, qna: 1, contact: 1 };
let currentFilter = { qna: '전체', contact: '전체' };
let currentDetail = null;
let writeTarget = null;

// 선택한 게시판 탭으로 이동하고 화면을 갱신
function sw(tab, el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    currentTab = tab;
    currentDetail = null;
    render();
}

// 현재 필터 조건에 맞는 게시글 목록을 반환
function getFilteredItems(tab) {
    let items = [...data[tab]];
    if (tab === 'qna' && currentFilter.qna !== '전체') {
        items = items.filter(i => i.badgeLabel === currentFilter.qna);
    }
    return items;
}

// 현재 로그인한 사용자가 관리자인지 확인
function checkIsAdmin() {
    const user = sessionStorage.getItem('loggedInUser') || localStorage.getItem('loggedInUser');
    return user === 'user_admin' || (localStorage.getItem('user_admin') === 'admin' && user === 'admin');
}

// 게시글 목록과 페이지를 화면에 출력
function render() {
    if (currentDetail) return renderDetail();

    const tab = currentTab;
    const main = document.getElementById('main-area');
    const items = getFilteredItems(tab);
    const page = currentPage[tab];
    const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const paged = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const isAdmin = checkIsAdmin();

    let html = '';

    if (tab === 'qna') {
        html += `<div class="filter-header"><div class="filter-bar">` +
            ['전체', '답변 완료', '미답변'].map(c =>
                `<button class="chip ${currentFilter.qna === c ? 'on' : ''}" onclick="setFilter('qna','${c}')">${c}</button>`
            ).join('') +
            `</div><button class="btn btn-primary" onclick="openModal()">+ 질문 작성</button></div>`;
    } else if (tab === 'contact' || (tab === 'notice' && isAdmin)) {
        html += `<div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
            <button class="btn btn-primary" onclick="openModal()">+ ${tab === 'notice' ? '공지' : '글'} 작성</button>
        </div>`;
    }

    html += '<table><tbody>';

    if (!paged.length) {
        html += `<tr><td colspan="2" style="text-align:center;padding:3rem;color:#AFA9EC">게시글이 없습니다.</td></tr>`;
    } else {
        paged.forEach((item, idx) => {
            const num = item.badge === 'b-pinned'
                ? '—'
                : items.length - ((page - 1) * ITEMS_PER_PAGE + idx);

            const cnt = item.comments?.length
                ? ` <span style="color:#7F77DD;font-size:11px">[${item.comments.length}]</span>`
                : '';

            html += `<tr class="has-item" onclick="openDetail('${tab}',${item.id})">
                <td class="col-n">${num}</td>
                <td>
                    <div class="post-title">
                        ${item.badge ? `<span class="badge ${item.badge}">${item.badgeLabel}</span>` : ''}
                        ${item.title}${cnt}
                    </div>
                    <div class="col-d">
                        ${item.date}
                        ${tab !== 'notice' ? ` · 작성자: ${item.author || '관리자'}` : ''}
                        · 조회: ${(item.views || 0).toLocaleString()}
                    </div>
                </td>
            </tr>`;
        });
    }

    html += '</tbody></table><div class="pager">';

    html += `<div class="pb ${page === 1 ? 'disabled' : ''}" onclick="goPage(${page - 1})">&#8249;</div>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<div class="pb ${i === page ? 'cur' : ''}" onclick="goPage(${i})">${i}</div>`;
    }

    html += `<div class="pb ${page === totalPages ? 'disabled' : ''}" onclick="goPage(${page + 1})">&#8250;</div></div>`;

    main.innerHTML = html;
}

// 게시글 상세 페이지를 열고 조회수를 증가
function openDetail(tab, id) {
    const item = data[tab].find(i => i.id === id);
    if (!item) return;

    item.views = (item.views || 0) + 1;
    saveData();

    currentDetail = { tab, id };
    renderDetail();
}

// 선택한 게시글의 상세 내용과 댓글을 출력
function renderDetail() {
    const { tab, id } = currentDetail;
    const item = data[tab].find(i => i.id === id);
    const main = document.getElementById('main-area');
    const user = sessionStorage.getItem('loggedInUser') || localStorage.getItem('loggedInUser');
    const isAdmin = checkIsAdmin();

    let html = `<div class="detail-back" onclick="closeDetail()">← 목록으로 돌아가기</div>
    <div class="detail-header">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div><span class="badge ${item.badge || ''}">${item.badgeLabel || ''}</span></div>
            ${tab === 'qna' && item.badgeLabel === '미답변' && (item.author === user || isAdmin) ? 
                `<button class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:12px;" onclick="completeResolution(${id})">답변 완료로 변경</button>` : ''}
        </div>
        <div class="detail-title">${item.title}</div>
        <div class="detail-meta">
            ${tab !== 'notice' ? `<span>작성자: ${tab === 'contact' ? '비공개' : item.author}</span>` : ''}
            <span>날짜: ${item.date}</span>
            ${tab !== 'contact' ? `<span>조회수: ${(item.views || 0).toLocaleString()}</span>` : ''}
        </div>
    </div>
    <div class="detail-body">${item.body}</div>
    <div class="comment-title">댓글 ${item.comments.length}개</div>`;

    item.comments.forEach(c => {
        html += `<div class="comment-item"><div class="comment-author">${c.author}</div><div class="comment-text">${c.text}</div></div>`;
    });

    html += `<div class="comment-input-row">
        <input type="text" id="comment-input" placeholder="댓글을 입력하세요" onkeydown="if(event.key==='Enter')addComment('${tab}',${id})" />
        <button class="btn btn-primary" onclick="addComment('${tab}',${id})">등록</button>
    </div>`;

    main.innerHTML = html;
}

// 질문 게시글을 답변 완료 상태로 변경
function completeResolution(id) {
    const item = data.qna.find(i => i.id === id);
    if (!item) return;

    item.badge = 'b-complete';
    item.badgeLabel = '답변 완료';

    saveData();
    renderDetail();
}

// 상세 화면을 닫고 목록 화면으로 복귀
const closeDetail = () => {
    currentDetail = null;
    render();
};

// 게시글에 댓글 추가
function addComment(tab, id) {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    const user = sessionStorage.getItem('loggedInUser') || localStorage.getItem('loggedInUser');

    if (!user) {
        alert('로그인 후 댓글을 작성할 수 있습니다.');
        location.href = './login.html';
        return;
    }

    if (!text) return;

    data[tab].find(i => i.id === id).comments.push({
        author: user,
        text
    });

    saveData();
    renderDetail();
}

// 게시글 필터를 변경하고 목록을 새로고침
function setFilter(tab, val) {
    currentFilter[tab] = val;
    currentPage[tab] = 1;
    render();
}

// 선택한 페이지로 이동
function goPage(p) {
    const total = Math.max(
        1,
        Math.ceil(getFilteredItems(currentTab).length / ITEMS_PER_PAGE)
    );

    if (p < 1 || p > total) return;

    currentPage[currentTab] = p;
    render();
}

// 게시글 작성 모달을 열고 로그인 여부 확인
function openModal() {
    const isAdmin = checkIsAdmin();
    const user = sessionStorage.getItem('loggedInUser') || localStorage.getItem('loggedInUser');

    if (!user && !isAdmin) {
        alert('로그인 후 이용할 수 있습니다.');
        location.href = './login.html';
        return;
    }

    if (currentTab === 'notice' && !isAdmin) {
        return alert('발전사항은 관리자만 작성할 수 있습니다.');
    }

    writeTarget = currentTab;

    document.getElementById('modal-title').textContent =
        currentTab === 'qna'
            ? '질문 작성'
            : currentTab === 'notice'
            ? '공지 작성'
            : '글 작성';

    document.getElementById('form-title').value = '';
    document.getElementById('form-body').value = '';

    document.getElementById('write-modal').classList.add('open');
}

// 게시글 작성 모달을 닫음
const closeModal = () =>
    document.getElementById('write-modal').classList.remove('open');

// 작성한 게시글을 저장
function submitPost() {
    const title = document.getElementById('form-title').value.trim();
    const body = document.getElementById('form-body').value.trim();

    if (!title || !body) {
        return alert('제목과 내용을 입력해주세요.');
    }

    const tab = writeTarget;

    if (tab === 'notice' && !checkIsAdmin()) {
        alert('권한이 없습니다.');
        closeModal();
        return;
    }

    const user =
        sessionStorage.getItem('loggedInUser') ||
        localStorage.getItem('loggedInUser') ||
        'admin';

    const newId =
        data[tab].length > 0
            ? Math.max(...data[tab].map(i => i.id)) + 1
            : 1;

    const now = new Date();

    data[tab].unshift({
        id: newId,
        badge: tab === 'qna' ? 'b-new' : tab === 'notice' ? 'b-pinned' : '',
        badgeLabel: tab === 'qna' ? '미답변' : tab === 'notice' ? '공지' : '',
        title,
        body,
        views: 0,
        comments: [],
        author: checkIsAdmin() ? '관리자' : user,
        date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
    });

    saveData();
    closeModal();

    currentPage[tab] = 1;
    render();
}

// 모달 외부 클릭 시 모달을 닫음
document.getElementById('write-modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

render();