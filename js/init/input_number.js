// Inputs only can be inside the maximum.
const clamp = (min, x, max) => Math.min(max, Math.max(min, x));
const inputs = document.querySelectorAll("input[type=number]");
for (const input of inputs) {
	input.addEventListener("change", (event) => {
		const max = event.target.getAttribute("max");
		const min = event.target.getAttribute("min");
		const value = event.target.value;
		if (value.length > 0) {
			if (min && max) {
				event.target.value = clamp(Number(min), Number(value), Number(max));
			} else if (min) {
				event.target.value = Math.max(Number(min), Number(value));
			} else if (max) {
				event.target.value = Math.min(Number(max), Number(value));
			}
		}
	});
}
