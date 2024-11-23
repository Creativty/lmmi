import { Users, Session, Items, Pages } from './api.ts';

namespace Data{
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
};

export default Data;
