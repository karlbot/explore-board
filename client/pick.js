// Tick screenshots and icons, then copy pointers to them all: one line each saying what it is and
// where its file is on the board's branch, to paste into a message to an AI.
const bar = document.querySelector('#picks')
const count = document.querySelector('#pickCount')
const copy = document.querySelector('#copyPicks')
const picked = () => [...document.querySelectorAll('input[name=pick]:checked')]

function show() {
  const n = picked().length
  bar.hidden = !n
  count.textContent = `${n} picked`
  copy.textContent = 'Copy references'
}

document.addEventListener('change', (event) => {
  if (event.target.name === 'pick') show()
})
copy.addEventListener('click', async () => {
  const lines = picked().map((box) => `- ${box.dataset.label}: ${box.value}\n  ${new URL(box.value, location.href)}`)
  // data-source says which board and branch the paths are on (board.js).
  await navigator.clipboard.writeText(`${bar.dataset.source}:\n\n${lines.join('\n')}\n`)
  copy.textContent = 'Copied'
})
document.querySelector('#clearPicks').addEventListener('click', () => {
  for (const box of picked()) box.checked = false
  show()
})
show()
