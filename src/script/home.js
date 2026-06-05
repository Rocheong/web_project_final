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

/* ✅ TOP 버튼 */
const btn = document.getElementById('topBtn')

window.addEventListener('scroll', () => {
  btn.style.display = window.scrollY > 300 ? 'block' : 'none'
})

btn.onclick = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
