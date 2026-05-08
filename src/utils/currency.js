export function inr(value) {
  const num = Number(value || 0);
  return `₹${num.toLocaleString("en-IN")}`;
}
