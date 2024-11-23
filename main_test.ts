import { assertEquals } from "@std/assert";
import { Server } from "./main.ts";

Deno.test("Request: /", async function () {
	const handle = Server();

	const req = new Request("http://localhost:8080/");
	const res = await handle(req);
	assertEquals(res.status, 200);
});
