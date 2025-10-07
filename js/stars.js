export function renderStars(value) {
  const match = String(value).match(/^([1-5])\/5$/);
  if (!match) return "";
  const score = parseInt(match[1]);
  return `<span class="rating-stars">${"★".repeat(score)}${"☆".repeat(5 - score)}</span>`;
}
