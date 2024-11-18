function ElementSession(cookie) {
	const cookie_session = getCookie(cookie_session_name);
	function createSessionDrop() {
		const template = document.getElementById("tmpl_session_drop");
		const button = template.content.firstElementChild.cloneNode(true);
		return (button);
	}
	function createSessionObtain() {
		const template = document.getElementById("tmpl_session_obtain");
		const button = template.content.firstElementChild.cloneNode(true);
		return (button);
	}
	if (!cookie_session)
		return (createSessionObtain());
	return (createSessionDrop());
}
