// fabric-meter.js
// Universal meter selector for fabric products

function increaseMeter(id) {
  const el = document.getElementById(id);
  el.value = Number(el.value) + 1;
}

function decreaseMeter(id) {
  const el = document.getElementById(id);
  if (Number(el.value) > 1) el.value = Number(el.value) - 1;
}
