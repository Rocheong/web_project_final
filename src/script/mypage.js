// localStorage에 저장할 때 사용할 키를 만듦
// type은 note, todos, mistakes 등 구분자이고 user는 로그인한 아이디
function getUserDataKey(type, user) {
  return `${type}_${user}`
}

// 로그인한 사용자의 메모를 로컬스토리지에서 불러옴
function loadUserNote(user) {
  return localStorage.getItem(getUserDataKey('note', user)) || ''
}

// 로그인한 사용자의 메모를 로컬스토리지에 저장
function saveUserNote(user, note) {
  localStorage.setItem(getUserDataKey('note', user), note)
}

// 로그인한 사용자의 할 일 목록을 로컬스토리지에서 불러옴
function loadUserTodos(user) {
  const raw = localStorage.getItem(getUserDataKey('todos', user))
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    // 데이터가 JSON 형식이 아니면 빈 배열로 초기화
    return []
  }
}

// 로그인한 사용자의 할 일 목록을 로컬스토리지에 저장
function saveUserTodos(user, todos) {
  localStorage.setItem(getUserDataKey('todos', user), JSON.stringify(todos))
}

// 로그인한 사용자의 오답 노트를 로컬스토리지에서 불러옴
function loadUserMistakes(user) {
  const raw = localStorage.getItem(getUserDataKey('mistakes', user))
  try {
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// 오답 노트 데이터를 화면에 카드 형태로 보여줌
function renderReviewNotes(mistakes) {
  const reviewList = document.getElementById('review-notes-list')
  if (!reviewList) return

  // 기존 내용을 모두 지우고 새로 그림
  reviewList.innerHTML = ''

  // 저장된 오답이 없을 때 보여줄 안내문
  if (!mistakes.length) {
    reviewList.innerHTML =
      '<div class="review-note-empty">저장된 오답이 없습니다.</div>'
    return
  }

  // 하나씩 카드로 만들어서 가로 스크롤 영역에 추가
  mistakes.forEach((mistake) => {
    const card = document.createElement('div')
    card.className = 'review-note-card'
    card.innerHTML = `
      <h4>${mistake.q}</h4>
      <p><span class="label">정답:</span> ${mistake.c}</p>
      <p><span class="label">내 답:</span> ${mistake.m}</p>
      <p><span class="label">분석:</span> ${mistake.a || '없음'}</p>
    `
    reviewList.appendChild(card)
  })
}

// 할 일 목록을 화면에 그리는 함수
function renderTodoList(todos) {
  const todoList = document.getElementById('todo-list')
  if (!todoList) return

  // 기존 할 일 목록을 초기화
  todoList.innerHTML = ''

  // 배열에 저장된 각 항목을 li 요소로 만들어 추가
  todos.forEach((todo, index) => {
    const item = document.createElement('li')
    item.className = 'todo-item'
    item.dataset.index = index

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = todo.done
    checkbox.className = 'todo-checkbox'
    checkbox.dataset.action = 'toggle'

    const text = document.createElement('span')
    text.className = todo.done ? 'todo-text done' : 'todo-text'
    text.innerText = todo.text

    const deleteBtn = document.createElement('button')
    deleteBtn.type = 'button'
    deleteBtn.className = 'todo-delete'
    deleteBtn.innerText = '삭제'
    deleteBtn.dataset.action = 'delete'

    item.appendChild(checkbox)
    item.appendChild(text)
    item.appendChild(deleteBtn)
    todoList.appendChild(item)
  })
}

// 페이지가 로드될 때 실행되는 코드
// 로그인한 사용자 정보를 sessionStorage에서 가져오고, 해당 사용자 데이터만 화면에 보여줌
window.addEventListener('DOMContentLoaded', () => {
  const user = sessionStorage.getItem('loggedInUser')
  if (!user) return

  const noteInput = document.getElementById('note-input')
  const noteDisplay = document.getElementById('note-display')
  const saveNoteButton = document.getElementById('save-note')
  const todoInput = document.getElementById('todo-input')
  const addTodoButton = document.getElementById('add-todo')
  const todoList = document.getElementById('todo-list')

  // 메모 기능 초기화
  if (noteInput && noteDisplay && saveNoteButton) {
    const note = loadUserNote(user)
    noteInput.value = note
    noteDisplay.innerText = note || '저장된 메모가 없습니다.'

    saveNoteButton.addEventListener('click', () => {
      const newNote = noteInput.value.trim()
      saveUserNote(user, newNote)
      noteDisplay.innerText = newNote || '저장된 메모가 없습니다.'
      noteInput.value = ''
      alert('메모가 저장되었습니다.')
    })
  }

  // 할 일 기능 초기화
  if (todoInput && addTodoButton && todoList) {
    let todos = loadUserTodos(user)
    renderTodoList(todos)

    addTodoButton.addEventListener('click', () => {
      const text = todoInput.value.trim()
      if (!text) {
        alert('할 일을 입력하세요.')
        return
      }
      todos.push({ text, done: false })
      saveUserTodos(user, todos)
      renderTodoList(todos)
      todoInput.value = ''
    })

    // 체크박스 클릭 또는 삭제 버튼 클릭 처리
    todoList.addEventListener('click', (event) => {
      const action = event.target.dataset.action
      const item = event.target.closest('.todo-item')
      if (!item) return
      const index = Number(item.dataset.index)
      if (Number.isNaN(index)) return

      if (action === 'toggle') {
        todos[index].done = event.target.checked
        saveUserTodos(user, todos)
        renderTodoList(todos)
      }
      if (action === 'delete') {
        todos.splice(index, 1)
        saveUserTodos(user, todos)
        renderTodoList(todos)
      }
    })
  }

  // 오답 노트 불러오기
  const userMistakes = loadUserMistakes(user)
  renderReviewNotes(userMistakes)
})
