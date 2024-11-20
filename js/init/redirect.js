// Fill all redirects with the current page value
const redirects = document.querySelectorAll("input[name=redirect]");
const iterator = Array.from(redirects);
for (const redirect of redirects)
	redirect.value = window.location.toString();
