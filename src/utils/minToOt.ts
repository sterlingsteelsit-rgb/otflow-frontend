export function minutesToOt(min: number) {
  const h = Math.round((min / 60) * 100) / 100;
  const s = String(h).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
  return `${s}`;
}
