import vento from "https://deno.land/x/vento@v0.9.1/mod.ts";
import { type Environment } from "https://deno.land/x/vento@v0.9.1/src/environment.ts";
import { Database } from 'jsr:@db/sqlite'
import { getCookies, setCookie, type Cookie } from 'jsr:@std/http/cookie'

const PORT: number | string = 8080;

interface RequestMetadata {
	db: Database,
	tmpl: Environment,
	patterns: Record<string, string | undefined>,
}

interface AppSearchParams {
	data: Record<string, string | undefined>,
	invalid: Record<string, string | undefined>,
}

namespace Utils {
	export function ResponseUncaught(error: unknown): Response {
		console.error(error);
		return new Response("A failure in the server has happened, please notify the developers", { status: 500 });
	}

	export function ResponseError(text: string, status: number = 500): Response {
		return new Response(text, { status });
	}

	export function ResponseNotFound(): Response {
		return new Response("Not Found", { status: 404 });
	}

	export function ResponseTODO(): Response {
		return new Response("TODO!: unimplemented endpoint", { status: 500 });
	}

	export function ResponseJSON(data: object | any, status = 200, _headers: Headers | undefined = undefined): Response {
		const text = typeof data === "string" ? data : JSON.stringify(data);
		const headers = new Headers();
		for (const [key, value] of _headers?.entries() ?? [])
			headers.set(key, value);
		headers.set("Content-Type", "application/json");
		return new Response(text, { status, headers });
	}

	export function ResponseHTML(page: any, status = 200, _headers: Headers | undefined = undefined): Response {
		const headers = new Headers();
		for (const [key, value] of _headers?.entries() ?? [])
			headers.set(key, value);
		headers.set("Content-Type", "text/html");
		return new Response(page, { status, headers });
	}

	export function ResponseFile(file: any, content_type = "text/plain"): Response {
		const headers = new Headers();
		headers.set("Content-Type", content_type);
		return (new Response(file, { status: 200, headers }));
	}

	export function SearchParamsToFields(params: URLSearchParams, predicates: Record<string, (_: string, __: string) => boolean> = {}): AppSearchParams {
		const entries = params.entries();
		const result: AppSearchParams = { invalid: {}, data: {} };
		for (const [key, value] of entries) {
			if (key === "id")
				continue ;
			if (typeof predicates[key] === "function")
				result[predicates[key](key, value) ? "data" : "invalid"][key] = value;
			else
				result["invalid"][key] = value;
		}
		return (result);
	}

	export function ObjectTestEmpty(obj: any): boolean {
		return (obj === "object" && (obj == null || Object.keys(obj).length === 0));
	}

	export function Timeout(ms: number): Promise<void> {
		return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
	}

	export function StateFactory(req: Request, meta: RequestMetadata): Record<string, any> {
		const cookies = getCookies(req.headers);
		const is_logged_in = Session.Test(cookies["sid"]);
		return { is_logged_in };
	}
}

namespace Users {
	interface User {
		id: number;
		username: string;
	};

	export function QueryMany(req: Request, meta: RequestMetadata): Response {
		const users = meta.db.prepare("SELECT rowid as id, username FROM users").all();
		return Utils.ResponseJSON(users);
	}

	export function QueryOne(req: Request, meta: RequestMetadata): Response {
		const url = new URL(req.url);
		const id = Number(url.searchParams.get("id") ?? "-1");
		if (!Number.isInteger(id) || id <= 0)
			return Utils.ResponseError("parameter `id` has to be an integer larger than 0", 400);
		const user = meta.db.prepare("SELECT rowid as id, username FROM users WHERE id = ?").get(id)
		if (!user)
			return Utils.ResponseError(`parameter \`id\` with value \`${id}\` doesn't exist in the database`, 400);
		return Utils.ResponseJSON(user);
	}

	export function UpdateOne(req: Request, meta: RequestMetadata): Response {
		const url = new URL(req.url);
		const id = Number(url.searchParams.get("id") ?? "-1");
		if (!Number.isInteger(id) || id <= 0)
			return (Utils.ResponseError("parameter `id` has to be an integer larger than 0", 400));
		const predicates = {
			"username": (key: string, value: string) => /^[a-zA-Z_-]{4,32}$/.test(value),
		};
		const app_params = Utils.SearchParamsToFields(url.searchParams, predicates);
		if (Object.keys(app_params.invalid).length > 0)
			return (Utils.ResponseError(`parameters [ ${Object.keys(app_params.invalid).join(", ")} ] are invalid`, 400));
		if (Object.keys(app_params.data).length === 0)
			return (Utils.ResponseError(`no fields were provided to update`, 400));
		const args = [];
		const statements = [];
		for (const key in app_params.data) {
			const value = app_params.data[key];
			const statement = `${key} = ?`;
			args.push(value);
			statements.push(statement);
		}
		const statement = `UPDATE users SET ${statements.join(", ")} WHERE rowid = ${id}`;
		const rows_updated = meta.db.prepare(statement).run(...args);
		if (rows_updated > 0)
			return (Utils.ResponseJSON(`{ "ok": true }`));
		return (Utils.ResponseError(`cannot update any users with \`id\` = \`${id}\``, 400));
	}

	export async function InsertOne(req: Request, meta: RequestMetadata): Promise<Response> {
		const content_type = req.headers.get("Content-Type");
		if (content_type !== "application/json")
			return (Utils.ResponseError("endpoint must receive json body", 400));
		const data = await req.json();
		return (Utils.ResponseTODO());
	}
}

namespace Session {
	const MANAGER_SECRET = "1337";
	const MANAGER_SESSION_ID = "a9ff8c";
	export function Test(sessionString: string | null | undefined): boolean {
		return (sessionString === MANAGER_SESSION_ID);
	}
	export async function Obtain(req: Request, meta: RequestMetadata): Promise<Response> {
		const params = await req.formData();
		const secret = params.get("secret");
		if (secret !== MANAGER_SECRET)
			return (Utils.ResponseError("The secret you provided is wrong...", 400));
		// Session ID
		const cookie: Cookie = { name: "sid", value: MANAGER_SESSION_ID, path: "/" };

		const redirection = params.get("redirect");
		const body = redirection ? null : `{ "ok": true }`;
		const status = redirection ? 303 : 200;
		const headers = new Headers({ "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Origin": "*" });
		setCookie(headers, cookie);
		if (redirection)
			headers.append("Location", String(redirection));
		else
			headers.append("Content-Type", "application/json");
		return (new Response(body, { status, headers }));
	}
}

namespace Pages {
	export async function Index(req: Request, meta: RequestMetadata): Promise<Response> {
		const table = [
			{ name: "Arduino UNO R3", quantity: { total: 3, reserved: 1 } },
			{ name: "Arduino UNO", quantity: { total: 0, reserved: 0 } },
			{ name: "LEGO Spike Set", quantity: { total: 1, reserved: 1 } },
			{ name: "Light Sensor", quantity: { total: 9, reserved: 7 } },
			{ name: "IR Sensor", quantity: { total: 2, reserved: 2 } },
			{ name: "433MHz Receiver", quantity: { total: 4, reserved: 0 } },
		].map((x, i) => ({ ...x, id: i + 1 }));

		const state = Utils.StateFactory(req, meta);
		const page_template = await meta.tmpl.load("../index.html");
		const page = await page_template({ ...state, table });
		return (Utils.ResponseHTML(page.content));
	}

	export async function Stylesheet(req: Request, meta: RequestMetadata): Promise<Response> {
		const filename = `${meta.patterns["0"]}.css`
		const stylesheet = await Deno.readFile("../" + filename);
		return (Utils.ResponseFile(stylesheet, "text/css"));
	}

	export async function Script(req: Request, meta: RequestMetadata): Promise<Response> {
		const filename = `${meta.patterns["0"]}.js`
		const script = await Deno.readFile("../" + filename);
		return (Utils.ResponseFile(script, "text/javascript"));
	}
}

namespace Items {
	export async function Details(req: Request, meta: RequestMetadata): Promise<Response> {
		const table = [
			{ name: "Arduino UNO R3", quantity: { total: 3, reserved: 1 } },
			{ name: "Arduino UNO", quantity: { total: 0, reserved: 0 } },
			{ name: "LEGO Spike Set", quantity: { total: 1, reserved: 1 } },
			{ name: "Light Sensor", quantity: { total: 9, reserved: 7 } },
			{ name: "IR Sensor", quantity: { total: 2, reserved: 2 } },
			{ name: "433MHz Receiver", quantity: { total: 4, reserved: 0 } },
		].map((x, i) => ({ ...x, id: i + 1 }));

		const ids = await req.json();
		const data = [];
		for (const id of ids) {
			const item = table.find(x => x.id === id);
			if (item)
				data.push(item);
		}
		return (Utils.ResponseJSON(data));
	}
}

namespace Data {
	export const routes = [
		// API
		{ pattern: new URLPattern({ pathname: "/api/session/obtain" }), handler: Session.Obtain, method: "POST" },
		{ pattern: new URLPattern({ pathname: "/api/items/details" }), handler: Items.Details, method: "POST" },
		// Database
		{ pattern: new URLPattern({ pathname: "/users/" }), handler: Users.QueryMany, method: "GET" },
		{ pattern: new URLPattern({ pathname: "/user", search: "*" }), handler: Users.QueryOne, method: "GET" },
		{ pattern: new URLPattern({ pathname: "/user", search: "*" }), handler: Users.UpdateOne, method: "PUT" },
		{ pattern: new URLPattern({ pathname: "/user/" }), handler: Users.InsertOne, method: "POST" },
		// Files
		{ pattern: new URLPattern({ pathname: "/" }), handler: Pages.Index, method: "GET" },
		{ pattern: new URLPattern({ pathname: "/*.js" }), handler: Pages.Script, method: "GET" },
		{ pattern: new URLPattern({ pathname: "/*.css" }), handler: Pages.Stylesheet, method: "GET" },
	];
	export const sqlite_file = "database.sqlite3";
}

function Server(): ((_: Request) => Promise<Response>) {
	const db = new Database(Data.sqlite_file);
	const tmpl: Environment = vento();
	async function HandleMatcher(req: Request): Promise<Response> {
		const route = Data.routes.find((route) => route.method === req.method && route.pattern.test(req.url));
		if (route === undefined)
			return (Utils.ResponseNotFound());
		tmpl.cache.clear(); // TODO(XENOBAS): Remove me once deployed.
		const { pattern, method, handler } = route;
		const match = pattern.exec(req.url);
		const { groups: patterns } = match?.pathname ?? { groups: {} };
		try {
			console.log(`[ENDPOINT] ${req.method} :: ${req.url}`);
			const res = await handler(req, { db, tmpl, patterns });
			return (res);
		} catch (error) {
			return Utils.ResponseUncaught(error);
		}
	}
	return HandleMatcher;
}

if (import.meta.main) {
	const serve_entry = Server();
	Deno.serve({ port: PORT }, serve_entry);
}
