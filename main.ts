import vento from "https://deno.land/x/vento@v0.9.1/mod.ts";
import { Database } from 'jsr:@db/sqlite'
import { type Environment } from "https://deno.land/x/vento@v0.9.1/src/environment.ts";
import Data from './data.ts';
import Utils from './utils.ts';

const PORT: number | string = 8080;

export function Server(): ((_: Request) => Promise<Response>) {
	const db = new Database(Data.sqlite_file);
	const tmpl: Environment = vento();
	async function HandleMatcher(req: Request): Promise<Response> {
		const route = Data.routes.find((route) => route.method === req.method && route.pattern.test(req.url));
		if (route === undefined)
			return (console.log(`[ENDPOINT 404 ${req.method}] :: ${req.url}`), Utils.ResponseNotFound());
		tmpl.cache.clear(); // TODO(XENOBAS): Remove me once deployed.
		const { pattern, method, handler } = route;
		const match = pattern.exec(req.url);
		const { groups: patterns } = match?.pathname ?? { groups: {} };
		try {
			const res = await handler(req, { db, tmpl, patterns });
			console.log(`[ENDPOINT ${res.status} ${req.method}] :: ${req.url}`);
			return (res);
		} catch (error) {
			return Utils.ResponseUncaught(error);
		}
	}
	return HandleMatcher;
}

export function Main(): void {
	const serve_entry = Server();
	Deno.serve({ port: Number(PORT) }, serve_entry);
}

if (import.meta.main) {
	Main();
}
