/**
 * STUDEO 퀴즈 핵심 스크립트 (라디오/체크박스/주관식 통합 채점 버전)
 */

// 1. 과목별 정답 정의
const ANSWER_KEY = {
  net1: ['2', '3', '4'],
  net2: ['2', '3', '4'],
  net3: [],
  net4: ['1', '2', '3', '4', '5'],
  net5: ['1', '2', '6'],
  net6: ['1', '2'],
  net7: ['5'],
  net8: [],
  net9: ['1', '2', '4'],
  net10: ['1', '2', '3', '5'],
  net11: ['1', '2', '5'],
  net12: ['1', '2', '3'],
  net13: ['3', '4', '5'],
  net14: ['1', '2'],
  net15: ['2', '5'],
  jq1: ['4'],
  jq2: ['2'],
  jq3: ['2'],
  jq4: ['4'],
  jq5: ['1'],
  jq6: ['4'],
  jq7: ['4'],
  jq8: ['2'],
  jq9: ['4'],
  jq10: ['1'],
  jq11: ['1'],
  jq12: ['1'],
  jq13: ['2'],
  jq14: ['2'],
  jq15: ['2'],
  net16: [], // 예시: 아무것도 체크 안 하는 게 정답인 경우 (빈 배열)
  net17: ['프로토콜'], // 예시: 주관식 정답 문자열 정의
}

let TOTAL_QUESTIONS = Object.keys(ANSWER_KEY).length
let timerInterval = null
let timeLeft = 0
let isPracticeMode = false

// 2. UI 요소를 동적으로 생성 및 강제 동기화하는 함수
function ensureRequiredUIElements() {
  if (!document.querySelector('.sticky-status-bar')) {
    const statusBar = document.createElement('div')
    statusBar.className = 'sticky-status-bar'
    statusBar.innerHTML = `
      <div class="status-timer" id="timer-display">⏱️ 대기 중...</div>
      <div class="status-progress-container">
        <div class="status-progress-bar">
          <div class="status-progress-fill" id="progress-fill"></div>
        </div>
        <div class="status-progress-text" id="progress-text">0 / 15</div>
      </div>
    `
    document.body.appendChild(statusBar)
  }

  let startModalOverlay = document.getElementById('start-modal')
  if (!startModalOverlay) {
    startModalOverlay = document.createElement('div')
    startModalOverlay.id = 'start-modal'
    document.body.appendChild(startModalOverlay)
  }
  startModalOverlay.className = 'custom-modal-overlay show'
  startModalOverlay.innerHTML = `
    <div class="custom-modal">
      <h2>퀴즈 시작 설정</h2>
      <p>풀이 방식을 선택해 주세요. 제한시간을 입력하여 시험을 치르거나, 시간 제한이 없는 연습모드로 진행할 수 있습니다.</p>
      <div class="timer-input-wrapper">
        <input type="number" id="start-timer-input" value="15" min="1" max="180">
        <span>분</span>
      </div>
      <div class="custom-modal-buttons">
        <button type="button" class="btn-start-timer" id="btn-confirm-start">확인 (타이머 시작)</button>
        <button type="button" class="btn-practice-mode" id="btn-practice-start">연습모드</button>
      </div>
    </div>
  `

  let resultModalOverlay = document.getElementById('result-modal')
  if (!resultModalOverlay) {
    resultModalOverlay = document.createElement('div')
    resultModalOverlay.id = 'result-modal'
    document.body.appendChild(resultModalOverlay)
  }
  resultModalOverlay.className = 'custom-modal-overlay'
  resultModalOverlay.innerHTML = `
    <div class="custom-modal">
      <h2 id="modal-title">퀴즈 결과</h2>
      <p id="modal-content">정답: -개 / 오답: -개</p>
      <div class="custom-modal-buttons">
        <button type="button" class="btn-close" id="btn-modal-close">나가기</button>
        <button type="button" class="btn-view-answers" id="btn-modal-view-answers">정답보기</button>
        <a href="wrong_notes.html" class="btn-wrong-notes">오답노트</a>
      </div>
    </div>
  `
}

// 3. 타이머 시스템
function startTimer() {
  if (isPracticeMode) return
  if (timerInterval) clearInterval(timerInterval)

  timerInterval = setInterval(() => {
    timeLeft--
    if (timeLeft <= 0) {
      clearInterval(timerInterval)
      timeLeft = 0
      updateTimerDisplay()
      alert('제한 시간이 만료되어 퀴즈가 자동으로 제출됩니다.')
      scoreQuiz()
    } else {
      updateTimerDisplay()
    }
  }, 1000)
}

function updateTimerDisplay() {
  const timerDisplay = document.getElementById('timer-display')
  if (!timerDisplay) return

  if (isPracticeMode) {
    timerDisplay.textContent = '🟢 연습모드 중 (시간 제한 없음)'
    timerDisplay.className = 'status-timer practice'
  } else {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const formattedSeconds = seconds < 10 ? '0' + seconds : seconds
    timerDisplay.textContent = `⏱️ 남은 시간 - ${minutes}:${formattedSeconds}`
    timerDisplay.className = 'status-timer'
  }
}

// 4. 팝업창 시작 처리
function handleQuizStart(mode) {
  const startModal = document.getElementById('start-modal')

  if (mode === 'timer') {
    const inputField = document.getElementById('start-timer-input')
    const inputMinutes = parseInt(inputField.value, 10)

    if (isNaN(inputMinutes) || inputMinutes <= 0) {
      alert('1분 이상의 올바른 시간을 입력해 주세요.')
      return
    }

    isPracticeMode = false
    timeLeft = inputMinutes * 60
    updateTimerDisplay()
    startTimer()
  } else if (mode === 'practice') {
    isPracticeMode = true
    updateTimerDisplay()
  }

  if (startModal) {
    startModal.classList.remove('show')
  }
}

// 5. 실시간 진행률 업데이트 (라디오, 체크박스, 주관식 모두 반영)
function updateProgress() {
  const questionBoxes = document.querySelectorAll('.question_box')
  const progressFill = document.getElementById('progress-fill')
  const progressText = document.getElementById('progress-text')

  if (questionBoxes.length === 0) return
  TOTAL_QUESTIONS = questionBoxes.length

  let solvedCount = 0
  questionBoxes.forEach((box) => {
    // 💡 라디오나 체크박스가 하나라도 체크되었는지 검사
    const hasGroupChecked = box.querySelector('input:checked') !== null
    // 주관식 입력창이 채워졌는지 검사
    const subjectiveInput = box.querySelector('.q_subjective_input')
    const hasTextInputFilled = subjectiveInput
      ? subjectiveInput.value.trim() !== ''
      : false

    if (hasGroupChecked || hasTextInputFilled) {
      solvedCount++
    }
  })

  const progressPercent = (solvedCount / TOTAL_QUESTIONS) * 100
  if (progressFill) progressFill.style.width = `${progressPercent}%`
  if (progressText)
    progressText.textContent = `${solvedCount} / ${TOTAL_QUESTIONS}`
}

// 6. 채점 시스템 (라디오 버튼 오류 수정 완료)
function scoreQuiz() {
  if (timerInterval) clearInterval(timerInterval)

  let correctCount = 0
  let wrongCount = 0

  const questionBoxes = document.querySelectorAll('.question_box')

  questionBoxes.forEach((box) => {
    const firstInput = box.querySelector('input')
    if (!firstInput) return

    const qNum = firstInput.getAttribute('name')
    const expectedAnswers = ANSWER_KEY[qNum] || []

    box.classList.remove('correct', 'wrong')
    const oldDisplay = box.querySelector('.correct-answer-display')
    if (oldDisplay) oldDisplay.remove()

    // [유형 A] 주관식 텍스트 입력창이 존재하는 경우
    const subjectiveInput = box.querySelector('.q_subjective_input')
    if (subjectiveInput) {
      subjectiveInput.classList.remove('correct-text', 'wrong-text')
      const userAnswer = subjectiveInput.value.trim()
      const correctAnswer = expectedAnswers[0] || ''

      if (userAnswer === correctAnswer) {
        correctCount++
        box.classList.add('correct')
        subjectiveInput.classList.add('correct-text')
      } else {
        wrongCount++
        box.classList.add('wrong')
        subjectiveInput.classList.add('wrong-text')

        const ansDiv = document.createElement('div')
        ansDiv.className = 'correct-answer-display'
        ansDiv.textContent = `💡 정답: ${correctAnswer}`
        box.appendChild(ansDiv)
      }
    }
    // [유형 B] 객관식 (라디오 / 체크박스 / 아무것도 체크 안 함 공통)
    else {
      box.querySelectorAll('label').forEach((lbl) => {
        lbl.classList.remove('user-correct', 'user-wrong', 'actual-correct')
      })

      // 💡 핵심 수정: input:checked를 사용하여 라디오와 체크박스를 둘 다 찾아냅니다.
      const checkedInputs = box.querySelectorAll('input:checked')
      const userAnswers = Array.from(checkedInputs).map((input) => input.value)

      const isCorrect =
        expectedAnswers.length === userAnswers.length &&
        expectedAnswers.every((val) => userAnswers.includes(val))

      if (isCorrect) {
        correctCount++
        box.classList.add('correct')
        checkedInputs.forEach((input) => {
          const label = input.closest('label')
          if (label) label.classList.add('user-correct')
        })
      } else {
        wrongCount++
        box.classList.add('wrong')

        // 정답이 아무것도 체크 안 하는 것([])이었는데 유저가 무언가 체크한 경우
        if (expectedAnswers.length === 0) {
          checkedInputs.forEach((input) => {
            const label = input.closest('label')
            if (label) label.classList.add('user-wrong')
          })
          const ansDiv = document.createElement('div')
          ansDiv.className = 'correct-answer-display'
          ansDiv.textContent = `💡 정답: 선택지 없음 (아무것도 체크하지 않는 것이 정답입니다.)`
          box.appendChild(ansDiv)
        }
        // 일반 객관식/라디오 정오답 피드백 처리
        else {
          box.querySelectorAll('label').forEach((label) => {
            const input = label.querySelector('input')
            if (!input) return
            const val = input.value

            if (expectedAnswers.includes(val)) {
              label.classList.add('actual-correct')
            } else if (input.checked) {
              label.classList.add('user-wrong')
            }
          })
        }
      }
    }
  })

  const resultModal = document.getElementById('result-modal')
  const modalTitle = document.getElementById('modal-title')
  const modalContent = document.getElementById('modal-content')

  if (resultModal && modalTitle && modalContent) {
    modalTitle.textContent = '퀴즈 결과'
    modalContent.innerHTML = `정답: <strong>${correctCount}</strong>개<br>오답: <strong>${wrongCount}</strong>개`
    resultModal.classList.add('show')
  }
}

// 7. 로드 시 이벤트 등록 및 제어
window.addEventListener('DOMContentLoaded', () => {
  ensureRequiredUIElements()
  updateProgress()

  // 모든 종류의 선택 변경(체크박스/라디오) 시 상단 진행률 바 동기화
  document.addEventListener('change', (e) => {
    if (
      e.target &&
      (e.target.type === 'checkbox' ||
        e.target.type === 'radio' ||
        e.target.classList.contains('q_subjective_input'))
    ) {
      updateProgress()
    }
  })

  // 주관식 키보드 입력 시 실시간 진행률 연동
  document.addEventListener('input', (e) => {
    if (e.target && e.target.classList.contains('q_subjective_input')) {
      updateProgress()
    }
  })

  // [제출하기] 버튼 이벤트
  const btnSubmit = document.querySelector('.btn_submit')
  if (btnSubmit) {
    btnSubmit.addEventListener('click', (e) => {
      e.preventDefault()
      scoreQuiz()
    })
  }

  // 시작 설정 팝업 버튼 바인딩
  document
    .getElementById('btn-confirm-start')
    .addEventListener('click', (e) => {
      e.preventDefault()
      handleQuizStart('timer')
    })

  document
    .getElementById('btn-practice-start')
    .addEventListener('click', (e) => {
      e.preventDefault()
      handleQuizStart('practice')
    })

  // [결과 팝업] 나가기 버튼 클릭 이벤트
  document.getElementById('btn-modal-close').addEventListener('click', (e) => {
    e.preventDefault()
    const resultModal = document.getElementById('result-modal')
    if (resultModal) resultModal.classList.remove('show')
    window.location.href = 'quizzes.html'
  })

  // [결과 팝업] 정답보기 버튼 클릭 이벤트
  document
    .getElementById('btn-modal-view-answers')
    .addEventListener('click', (e) => {
      e.preventDefault()

      const resultModal = document.getElementById('result-modal')
      if (resultModal) resultModal.classList.remove('show')

      document.querySelectorAll('.question_box input').forEach((input) => {
        input.disabled = true
      })

      const timerDisplay = document.getElementById('timer-display')
      if (timerDisplay) {
        timerDisplay.textContent = '🔴 정답확인 중'
        timerDisplay.className = 'status-timer review'
      }

      const originalSubmitBtn = document.querySelector('.btn_submit')
      if (originalSubmitBtn) {
        originalSubmitBtn.style.display = 'none'

        if (!document.getElementById('review-bottom-actions')) {
          const actionContainer = document.createElement('div')
          actionContainer.id = 'review-bottom-actions'
          actionContainer.className = 'review-bottom-buttons'
          actionContainer.innerHTML = `
          <button type="button" class="btn-review-exit" id="btn-bottom-exit">확인 완료</button>
          <a href="wrong_notes.html" class="btn-review-wrong">오답노트로 가기</a>
        `

          originalSubmitBtn.parentNode.insertBefore(
            actionContainer,
            originalSubmitBtn.nextSibling,
          )

          document
            .getElementById('btn-bottom-exit')
            .addEventListener('click', (ev) => {
              ev.preventDefault()
              window.location.href = 'quizzes.html'
            })
        }
      }
    })
})
