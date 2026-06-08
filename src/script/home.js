const targets = document.querySelectorAll('.page')

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const texts = entry.target.querySelectorAll('.section h2, .section > p')
      const cards = entry.target.querySelectorAll('.big-card .card')

      // ✅ 충분히 들어왔을 때만 등장
      if (entry.intersectionRatio > 0.4) {
        texts.forEach((text, i) => {
          if (!text.classList.contains('show')) {
            setTimeout(() => {
              text.classList.add('show')
            }, i * 120)
          }
        })

        cards.forEach((card, i) => {
          if (!card.classList.contains('show')) {
            setTimeout(
              () => {
                card.classList.add('show')
              },
              200 + i * 150,
            )
          }
        })
      }

      // ✅ 충분히 벗어났을 때만 제거 (깜빡임 방지 핵심)
      else if (entry.intersectionRatio < 0.1) {
        texts.forEach((text) => {
          text.classList.remove('show')
        })

        cards.forEach((card) => {
          card.classList.remove('show')
        })
      }
    })
  },
  {
    threshold: [0, 0.1, 0.4, 1],
  },
)

targets.forEach((el) => observer.observe(el))

/* ===================================================
   ✅ TOP 버튼 및 헤더 스크롤/모바일 토글 연동 처리 (최종본)
   =================================================== */
const btn = document.getElementById('topBtn')
const header = document.querySelector('header')
const mobileMenuBtn = document.getElementById('mobile-menu')
const navLinks = document.querySelector('.nav-links')

// 헤더의 상태(스크롤 여부 및 모바일 메뉴 오픈 여부)를 체크하여 배경을 바꾸는 함수
function updateHeaderState() {
  if (!header) return

  const isScrolled = window.scrollY > 50
  const isMenuOpen = navLinks && navLinks.classList.contains('active')

  // 1) 스크롤이 내려갔거나 2) 모바일 토글 메뉴가 열려있다면 하얀 배경 클래스(.scrolled) 추가
  if (isScrolled || isMenuOpen) {
    header.classList.add('scrolled')
  } else {
    header.classList.remove('scrolled')
  }
}

// 1. 스크롤 발생 시 TOP 버튼 노출 및 헤더 상태 실시간 감지
window.addEventListener('scroll', () => {
  if (btn) {
    btn.style.display = window.scrollY > 300 ? 'block' : 'none'
  }
  updateHeaderState()
})

// 2. 모바일 햄버거 버튼 클릭 시 헤더 배경 연동 감지
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    // main.js의 토글 클래스(.active)가 붙는 타이밍을 안전하게 맞추기 위해 10ms 미세한 시차를 두고 검사
    setTimeout(updateHeaderState, 10)
  })
}

// 3. TOP 버튼 클릭 시 부드럽게 최상단 이동
if (btn) {
  btn.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
