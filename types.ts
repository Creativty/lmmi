import { Database } from 'jsr:@db/sqlite'
import { type Environment } from "https://deno.land/x/vento@v0.9.1/src/environment.ts";

export  interface RequestMetadata {
	db: Database,
	tmpl: Environment,
	patterns: Record<string, string | undefined>,
}

export  interface AppSearchParams {
	data: Record<string, string | undefined>,
	invalid: Record<string, string | undefined>,
}
