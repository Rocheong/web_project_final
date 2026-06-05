// ✅ 유저 데이터 키 생성
function getUserDataKey(type, user) {
  return `${type}_${user}`
}

// ✅ 로컬스토리지에서 유저의 오답 불러오기
function loadUserMistakes(user) {
  const raw = localStorage.getItem(getUserDataKey('mistakes', user))
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ✅ 로컬스토리지에 유저의 오답 저장
function saveUserMistakes(user, mistakes) {
  localStorage.setItem(
    getUserDataKey('mistakes', user),
    JSON.stringify(mistakes),
  )
}

// 전역 변수로 현재 유저의 오답 배열 관리
let currentUserMistakes = []
let currentUser = sessionStorage.getItem('loggedInUser')

// ✅ 에러 초기화
function clearErrors() {
  document.querySelectorAll('input, textarea').forEach((el) => {
    el.classList.remove('error')
  })
}

// ✅ 입력 상태 (초록/빨강)
function addSuccessStyle(el) {
  el.addEventListener('input', () => {
    if (el.value.trim()) {
      el.classList.remove('error')
      el.classList.add('success')
    } else {
      el.classList.remove('success')
    }
  })
}

document.querySelectorAll('input, textarea').forEach((el) => {
  addSuccessStyle(el)
})

// ✅ 오답 목록 렌더링
function renderMistakes() {
  const noteList = document.getElementById('noteList')
  if (!noteList) return
  noteList.innerHTML = ''
  currentUserMistakes.forEach((mistake, index) => {
    const note = document.createElement('div')
    note.className = 'note'
    note.dataset.index = index
    note.innerHTML = createNoteHTML(mistake.q, mistake.c, mistake.m, mistake.a)
    noteList.appendChild(note)
  })
}

// ✅ 오답 추가
function addNote() {
  const q = document.getElementById('question')
  const c = document.getElementById('correct')
  const m = document.getElementById('myAnswer')
  const a = document.getElementById('analysis')

  clearErrors()

  let missing = []

  if (!q.value.trim()) {
    q.classList.add('error')
    missing.push('문제')
  }
  if (!c.value.trim()) {
    c.classList.add('error')
    missing.push('정답')
  }
  if (!m.value.trim()) {
    m.classList.add('error')
    missing.push('내 답')
  }

  if (missing.length > 0) {
    alert(`입력하세요 → ${missing.join(', ')}`)
    return
  }

  // 배열에 추가
  currentUserMistakes.push({
    q: q.value,
    c: c.value,
    m: m.value,
    a: a.value,
  })

  // localStorage 저장
  if (currentUser) {
    saveUserMistakes(currentUser, currentUserMistakes)
  }

  // 화면 렌더링
  renderMistakes()

  // 초기화
  document.querySelectorAll('input, textarea').forEach((el) => {
    el.value = ''
    el.classList.remove('success')
  })
}

// ✅ 카드 HTML
function createNoteHTML(q, c, m, a) {
  return `
    <h4 class="q">${q}</h4>
    <p><b>정답:</b> <span class="c">${c}</span></p>
    <p><b>내 답:</b> <span class="m">${m}</span></p>
    <p><b>분석:</b> <span class="a">${a || '없음'}</span></p>

    <button class="edit-btn" onclick="editNote(this)">수정</button>
    <button class="delete-btn" onclick="deleteNote(this)">삭제</button>
  `
}

// ✅ 삭제
function deleteNote(btn) {
  const note = btn.closest('.note')
  if (!note) return

  const index = Number(note.dataset.index)
  if (Number.isNaN(index)) return

  currentUserMistakes.splice(index, 1)

  if (currentUser) {
    saveUserMistakes(currentUser, currentUserMistakes)
  }

  renderMistakes()
}

// ✅ 수정
function editNote(btn) {
  const note = btn.closest('.note')
  if (!note) return

  const q = note.querySelector('.q').innerText
  const c = note.querySelector('.c').innerText
  const m = note.querySelector('.m').innerText
  const a = note.querySelector('.a').innerText
  const index = note.dataset.index

  note.innerHTML = `
    <textarea class="edit-q">${q}</textarea>
    <input class="edit-c" value="${c}">
    <input class="edit-m" value="${m}">
    <textarea class="edit-a">${a}</textarea>

    <button class="primary" onclick="saveNote(this)">저장</button>
    <button class="delete-btn" onclick="deleteNote(this)">삭제</button>
  `
}

// ✅ 저장
function saveNote(btn) {
  const note = btn.closest('.note')
  if (!note) return

  const q = note.querySelector('.edit-q').value
  const c = note.querySelector('.edit-c').value
  const m = note.querySelector('.edit-m').value
  const a = note.querySelector('.edit-a').value
  const index = Number(note.dataset.index)

  if (Number.isNaN(index)) return

  // 배열 업데이트
  currentUserMistakes[index] = {
    q: q,
    c: c,
    m: m,
    a: a,
  }

  if (currentUser) {
    saveUserMistakes(currentUser, currentUserMistakes)
  }

  renderMistakes()
}

// ✅ TIP
const tips = [
  '① 오답을 기록하자',
  '② 왜 틀렸는지 분석',
  '③ 개념 부족 확인',
  '④ 반복 복습',
  '⑤ 완전히 이해',
]

let currentTip = 0

function startTip() {
  currentTip = 0
  showTip()
  document.getElementById('tipModal').classList.add('show')
}

function showTip() {
  document.getElementById('tipText').innerText = tips[currentTip]
}

function nextTip() {
  if (currentTip < tips.length - 1) {
    currentTip++
    showTip()
  }
}

function prevTip() {
  if (currentTip > 0) {
    currentTip--
    showTip()
  }
}

function closeTip() {
  document.getElementById('tipModal').classList.remove('show')
}

// ✅ 페이지 로드 시 저장된 오답 불러오기
window.addEventListener('DOMContentLoaded', () => {
  currentUser = sessionStorage.getItem('loggedInUser')
  if (currentUser) {
    currentUserMistakes = loadUserMistakes(currentUser)
    renderMistakes()
  }
})
