// export function startBars() {
//     const bars = document.querySelectorAll(".bar");
//     bars.forEach(bar => bar.classList.add("animate-bars"));
//   }
  
//   export function stopBars() {
//     const bars = document.querySelectorAll(".bar");
//     bars.forEach(bar => bar.classList.remove("animate-bars"));
//   }
export function startAnimation() {
  const bars = document.querySelectorAll(".bar");
  bars.forEach(bar => bar.classList.add("active"));
}

export function stopAnimation() {
  const bars = document.querySelectorAll(".bar");
  bars.forEach(bar => bar.classList.remove("active"));
}
