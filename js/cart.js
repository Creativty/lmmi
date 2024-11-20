// BUG(XENOBAS): Adding items one-by-one overflows the available quantity.

function CartAdd(id, amount, name = "<unknown>") {
	id = Number(id);
	amount = Number(amount);
	if (amount <= 0)
		return alert("card_add: invalid amount");
	const detail = { id, amount, name };
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

function DialogCartSubmit() {
	const dialog = document.getElementById("dialog_cart");
	const input = dialog.querySelector("input#dialog_cart_item_amount");

	const data = dialog.dataset;
	const id = data["itemId"];
	const name = data["itemName"] ?? "<unknown>";
	const amount = Number(input.value);
	CartAdd(id, amount, name);
	dialog.close();
}

function DialogCartOpen(id, qt_total, qt_reserved) {
	const amount_max = Number(qt_total) - Number(qt_reserved);

	const dialog = document.getElementById("dialog_cart");
	const row = document.querySelector(`[data-item-id="${id}"]`);
	// Name
	const title = dialog.querySelector("u#dialog_cart_item_title");
	const input = dialog.querySelector("input#dialog_cart_item_amount");

	const name = row.getAttribute("data-item-name");
	dialog.setAttribute("data-item-id", id);
	dialog.setAttribute("data-item-name", name);
	title.innerText = name;
	input.value = "1";
	input.setAttribute("max", amount_max);

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
	const list = display.querySelector("ul#cart_items");
	const list_elements = [];
	for (const item of cart) {
		const li = document.createElement("li");
		li.innerText = `${item.amount}x ${item.name}`;
		list_elements.push(li);
	}
	list.replaceChildren(...list_elements);

	if (cart.length > 0)
		display.classList.add("visible");
	else
		display.classList.remove("visible");
}

document.addEventListener("cart_add", function (event) {
	const cart = __cart_load();
	const { id, amount, name = "<unknown>" } = event.detail;
	const index = cart.findIndex(x => x.id === id);
	if (index === -1)
		cart.push({ id, amount, name });
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
