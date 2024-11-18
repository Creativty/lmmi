function CartAdd(id, amount) {
	id = Number(id);
	amount = Number(amount);
	if (amount <= 0)
		return alert("card_add: invalid amount");
	const detail = { id, amount };
	const event = new CustomEvent("cart_add", { detail });

	document.dispatchEvent(event);
}

function CartRemove(id, amount) {
	id = Number(id);
	amount = Number(amount);
	if (amount <= 0)
		return alert("cart_remove: invalid amount");
	const detail = { id, amount };
	const event = new CustomEvent("cart_remove", { detail });

	document.dispatchEvent(event);
}

function CartPopup(id) {
	const dialog = document.getElementById("dialog_cart");
	const row = document.querySelector(`[data-item-id="${id}"]`);
	// Name
	const title = dialog.querySelector("h3");
	title.innerText = row.getAttribute("data-item-name");
	dialog.showModal();
}

function __cart_load() {
	return (JSON.parse(localStorage.getItem("cart") ?? "[]"));
}

function __cart_upload(cart) {
	localStorage.setItem("cart", JSON.stringify(cart ?? []));
}

function __cart_display(cart = []) {
	const display = document.getElementById("cart");
	if (cart.length > 0)
		display.classList.add("visible");
	else
		display.classList.remove("visible");
}

document.addEventListener("cart_add", function (event) {
	const cart = __cart_load();
	const { id, amount } = event.detail;
	const index = cart.findIndex(x => x.id === id);
	if (index === -1)
		cart.push({ id, amount });
	else
		cart[index].amount += amount;
	__cart_upload(cart);
	__cart_display(cart);
});

document.addEventListener("cart_remove", function (event) {
	const cart = __cart_load();
	const { id, amount } = event.detail;
	const index = cart.findIndex(x => x.id === id);
	if (index >= 0) {
		cart[index].amount -= amount;
		if (cart[index].amount <= 0)
			cart.splice(index, 1);
	}
	__cart_upload(cart);
	__cart_display(cart);
});

document.addEventListener("DOMContentLoaded", function (event) {
	if (localStorage.getItem("cart") === null)
		localStorage.setItem("cart", "[]");
	const cart = __cart_load();
	__cart_display(cart);
});
