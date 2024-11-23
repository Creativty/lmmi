import Utils from './utils.ts';
import { setCookie, type Cookie } from 'jsr:@std/http/cookie'

export namespace Users {
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

export namespace Session {
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

export namespace Pages {
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
		const page_template = await meta.tmpl.load("static/index.html");
		const page = await page_template({ ...state, table });
		return (Utils.ResponseHTML(page.content));
	}

	export async function Stylesheet(req: Request, meta: RequestMetadata): Promise<Response> {
		const filename = `${meta.patterns["0"]}.css`
		const stylesheet = await Deno.readFile("static/" + filename);
		return (Utils.ResponseFile(stylesheet, "text/css"));
	}

	export async function Script(req: Request, meta: RequestMetadata): Promise<Response> {
		const filename = `${meta.patterns["0"]}.js`
		const script = await Deno.readFile("static/" + filename);
		return (Utils.ResponseFile(script, "text/javascript"));
	}
}

export namespace Items {
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
