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

function DialogCartSubmit() {
	const dialog = document.getElementById("dialog_request_add");
	const input = dialog.querySelector("input#dialog_request_add_amount");

	const data = dialog.dataset;
	const id = data["itemId"];
	const amount = Number(input.value);
	CartAdd(id, amount);
	dialog.close();
}

function DialogCartOpen(id, qt_total, qt_reserved) {
	const amount_max = Number(qt_total) - Number(qt_reserved);

	const dialog = document.getElementById("dialog_request_add");
	const row = document.querySelector(`[data-item-id="${id}"]`);
	// Name
	const title = dialog.querySelector("u#dialog_request_add_title");
	const input = dialog.querySelector("input#dialog_request_add_amount");

	const name = row.getAttribute("data-item-name");
	dialog.setAttribute("data-item-id", id);
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

async function __cart_fetch(cart = []) {
	const ids = cart.map(({ id }) => id);
	const res = await fetch('/api/items/details', {
		method: "POST",
		headers: new Headers({
			"Content-Type": "application/json",
		}),
		body: JSON.stringify(ids),
	});
	const data = await res.json();
	return (data);
}

async function __cart_display(cart = []) {
	const data = await __cart_fetch(cart);
	const display = document.getElementById("cart");
	const list = display.querySelector("ul#cart_items");
	const list_elements = [];
	for (const item of cart) {
		const li = document.createElement("li");
		const name = data.find(x => Number(x.id) === Number(item.id))?.name ?? "<unknown>";
		li.innerText = `${item.amount}x ${name}`;
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
	const { id, amount } = event.detail;
	const index = cart.findIndex(x => x.id === id);
	// TODO(XENOBAS): BUG(Adding items one-by-one overflows the available quantity.)
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
