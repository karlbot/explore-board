// Tick two to four explorations to see only those, side by side. The choice is kept in the
// address (?compare=a,b), so a comparison can be reloaded or shared.
const boxes = [...document.querySelectorAll('input[name=compare]')]
const hint = document.querySelector('#compareHint')
const showAll = document.querySelector('#showAll')
const icons = document.querySelector('#icons')

function show() {
  const picked = boxes.filter((box) => box.checked).map((box) => box.value)
  const comparing = picked.length >= 2
  document.body.classList.toggle('comparing', comparing)
  document.body.style.setProperty('--picked', picked.length)
  for (const box of boxes) box.disabled = !box.checked && picked.length >= 4
  // Sections, and the icon table's columns, each carry their exploration's folder name.
  for (const el of document.querySelectorAll('[data-slug]')) el.hidden = comparing && !picked.includes(el.dataset.slug)
  if (icons) {
    for (const row of icons.querySelectorAll('tr:has(td)')) row.hidden = !row.querySelector('td:not([hidden]) img')
    icons.hidden = !icons.querySelector('th[data-slug]:not([hidden])')
  }
  hint.textContent = ['Tick two to four to compare.', 'Tick one more to compare.'][picked.length] ?? `Comparing ${picked.length}.`
  showAll.hidden = !picked.length

  const url = new URL(location.href)
  if (picked.length) url.searchParams.set('compare', picked.join(','))
  else url.searchParams.delete('compare')
  history.replaceState(null, '', url)
}

const asked = new URLSearchParams(location.search).get('compare')?.split(',') ?? []
for (const box of boxes) box.checked = asked.slice(0, 4).includes(box.value)
for (const box of boxes) box.addEventListener('change', show)
showAll.addEventListener('click', () => {
  for (const box of boxes) box.checked = false
  show()
})
show()
