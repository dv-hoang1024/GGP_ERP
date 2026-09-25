document.addEventListener("DOMContentLoaded", () => {
	if (document.body.dataset.path !== "login") {
		return;
	}

	document.querySelectorAll("img.app-logo").forEach((logo) => {
		logo.src = "/assets/gg_power/images/gg-power-logo.png";
		logo.alt = "GG Power";
	});
});
