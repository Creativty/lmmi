import { Session } from './api.ts';
import { getCookies } from 'jsr:@std/http/cookie'

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

export default Utils;
