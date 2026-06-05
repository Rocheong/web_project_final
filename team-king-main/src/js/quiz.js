// 1. 과목별 정답 정의 (HTML의 name 속성과 일치해야 합니다)
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
  sq1: ['2'],
  sq2: ['3'],
  sq3: ['1'],
  sq4: ['2'],
  sq5: ['2'],
  sq6: ['3'],
  sq7: ['2'],
  sq8: ['2'],
  sq9: ['1'],
  sq10: ['4'],
  sq11: ['3'],
  sq12: ['4'],
  sq13: ['1'],
  sq14: ['3'],
  sq15: ['2'],
  serq1: ['2'],
  serq2: ['bash'],
  serq3: ['#'],
  serq4: ['3'],
  serq5: ['-rf'],
  serq6: ['touch'],
  serq7: ['3'],
  serq8: ['755'],
  serq9: ['2'],
  serq10: ['>>'],
  serq11: ['3'],
  serq12: ['wq!'],
  serq13: ['2'],
  serq14: ['-i'],
  serq15: ['2'],
  wq1: ['1'],
  wq2: ['1'],
  wq3: ['3'],
  wq4: ['3'],
  wq5: ['3'],
  wq6: ['2'],
  wq7: ['4'],
  wq8: ['2'],
  wq9: ['2'],
  wq10: ['2'],
  wq11: ['3'],
  wq12: ['1'],
  wq13: ['1'],
  wq14: ['1'],
  wq15: ['4'],
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
      <p>풀이 방식을 선택해 주세요.<br>제한시간을 입력하여 시험을 치르거나, <br>시간 제한이 없는 연습모드로 진행할 수 있습니다.</p>
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
        <a href="../../pages/mistake.html" class="btn-wrong-notes">오답노트</a>
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

// 5. 실시간 진행률 업데이트 (초강력 개편: 어떤 input 형태든 오차 없이 감지)
function updateProgress() {
  const questionBoxes = document.querySelectorAll('.question_box')
  const progressFill = document.getElementById('progress-fill')
  const progressText = document.getElementById('progress-text')

  if (questionBoxes.length === 0) return
  TOTAL_QUESTIONS = questionBoxes.length

  let solvedCount = 0
  questionBoxes.forEach((box) => {
    // 선택된 라디오나 체크박스가 있는지 검사
    const hasGroupChecked =
      box.querySelector(
        'input[type="radio"]:checked, input[type="checkbox"]:checked',
      ) !== null

    // 텍스트를 입력하는 주관식 항목이 채워졌는지 검사 (라디오/체크박스가 아닌 모든 일반 input)
    const textInput = box.querySelector(
      'input:not([type="radio"]):not([type="checkbox"])',
    )
    const hasTextInputFilled = textInput ? textInput.value.trim() !== '' : false

    if (hasGroupChecked || hasTextInputFilled) {
      solvedCount++
    }
  })

  const progressPercent = (solvedCount / TOTAL_QUESTIONS) * 100
  if (progressFill) progressFill.style.width = `${progressPercent}%`
  if (progressText)
    progressText.textContent = `${solvedCount} / ${TOTAL_QUESTIONS}`
}

// 6. 채점 시스템 (🔥 주관식 탐색 메커니즘 100% 완전 무결 정밀 개편)
function scoreQuiz() {
  if (timerInterval) clearInterval(timerInterval)

  let correctCount = 0
  let wrongCount = 0

  const questionBoxes = document.querySelectorAll('.question_box')

  questionBoxes.forEach((box) => {
    // 스타일 및 기존 정답 알림 초기화
    box.classList.remove('correct', 'wrong')
    const oldDisplay = box.querySelector('.correct-answer-display')
    if (oldDisplay) oldDisplay.remove()

    // 💡 핵심 수정: 단순 순서 조회가 아니라, 박스 내부에서 ANSWER_KEY 딕셔너리에 매칭되는 진짜 name 코드를 가진 input을 찾아냅니다.
    let qNum = null
    let targetInput = null
    const allInputs = box.querySelectorAll('input')

    for (let input of allInputs) {
      // name 속성 우선, 없으면 id 속성으로 폴백 (주관식은 id만 존재)
      const key = input.getAttribute('name') || input.getAttribute('id')
      if (key && ANSWER_KEY.hasOwnProperty(key)) {
        qNum = key
        targetInput = input
        break
      }
    }

    // 일치하는 정답 정의가 아예 누락된 상자라면 채점 대상에서 안전하게 패스
    if (!qNum || !targetInput) {
      return
    }

    const expectedAnswers = ANSWER_KEY[qNum]

    // 💡 유형 판별: 내부에 선택형 버튼(라디오/체크)이 존재하지 않는다면 주관식 텍스트 문제로 100% 완벽 판정합니다.
    const isRadioOrCheckbox =
      box.querySelector('input[type="radio"], input[type="checkbox"]') !== null
    const isSubjective = !isRadioOrCheckbox

    // [유형 A] 주관식 텍스트 문제 채점
    if (isSubjective) {
      targetInput.classList.remove('correct-text', 'wrong-text')

      // 사용자가 쓴 정답 소문자화 + 양끝 공백 제거
      const userAnswer = targetInput.value.trim().toLowerCase()

      // 정답 배열 내부 데이터들도 전부 안전하게 텍스트 및 소문자 정제 처리
      const cleanExpectedAnswers = expectedAnswers.map((ans) =>
        ans.toString().trim().toLowerCase(),
      )

      // 입력칸이 비어있지 않고, 정답 후보군 리스트에 사용자가 쓴 정답이 들어있다면 합격!
      const isCorrectSubjective =
        userAnswer !== '' && cleanExpectedAnswers.includes(userAnswer)

      if (!isCorrectSubjective) {
        wrongCount++
        box.classList.add('wrong')
        targetInput.classList.add('wrong-text')

        const ansDiv = document.createElement('div')
        ansDiv.className = 'correct-answer-display'
        ansDiv.textContent = `💡 정답: ${expectedAnswers[0] || '미지정'}`
        box.appendChild(ansDiv)
      } else {
        correctCount++
        box.classList.add('correct')
        targetInput.classList.add('correct-text')
      }
    }
    // [유형 B] 객관식 문제 채점 (라디오 / 체크박스 공통)
    else {
      box.querySelectorAll('label').forEach((lbl) => {
        lbl.classList.remove('user-correct', 'user-wrong', 'actual-correct')
      })

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

  // 모든 종류의 선택 변경(체크박스/라디오/주관식) 시 상단 진행률 바 동기화
  document.addEventListener('change', (e) => {
    if (e.target && e.target.tagName === 'INPUT') {
      updateProgress()
    }
  })

  // 주관식 키보드 입력 시 실시간 진행률 연동
  document.addEventListener('input', (e) => {
    if (e.target && e.target.tagName === 'INPUT') {
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
            <a href="../../pages/mistake.html" class="btn-review-wrong">오답노트로 가기</a>
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
