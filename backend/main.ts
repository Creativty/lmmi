import { Database } from 'jsr:@db/sqlite'

const PORT: number | string = 8080;

interface RequestMetadata {
	db: Database,
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

	export function SearchParamsToFields(params: URLSearchParams, predicates: Record<string, (string, string) => boolean> = {}): AppSearchParams {
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
			"username": (key, value) => /^[a-zA-Z_-]{4,32}$/.test(value),
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

namespace Data {
	export const routes = [
		{ pattern: new URLPattern({ pathname: "/users/" }), handler: Users.QueryMany, method: "GET" },
		{ pattern: new URLPattern({ pathname: "/user", search: "*" }), handler: Users.QueryOne, method: "GET" },
		{ pattern: new URLPattern({ pathname: "/user", search: "*" }), handler: Users.UpdateOne, method: "PUT" },
		{ pattern: new URLPattern({ pathname: "/user/" }), handler: Users.InsertOne, method: "POST" },
	];
	export const sqlite_file = "database.sqlite3";
}

function Server(): (_: Request) => Promise<Response> {
	const db = new Database(Data.sqlite_file);
	async function HandleMatcher(req: Request): Promise<Response> {
		const route = Data.routes.find((route) => route.method === req.method && route.pattern.test(req.url));
		if (route === undefined)
			return (Utils.ResponseNotFound());
		const { pattern, method, handler } = route;
		const match = pattern.exec(req.url);
		const { groups: patterns } = match.pathname;
		try {
			console.log(`[DEBUG] endpoint ${req.url}`);
			const res = await handler(req, { db, patterns });
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