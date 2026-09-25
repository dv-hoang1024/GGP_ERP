(function () {
	"use strict";

	function load(source) {
		const existing = document.querySelector(`script[src="${source}"]`);
		if (existing) return Promise.resolve();

		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = source;
			script.async = false;
			script.addEventListener("load", resolve, { once: true });
			script.addEventListener("error", reject, { once: true });
			document.head.appendChild(script);
		});
	}

	load("/assets/gg_power/js/gg_power_desk.js?revision=20260925-9")
		.then(() => load("/assets/gg_power/js/gg_power_manufacturing_dashboard.js?revision=20260925-9"))
		.catch((error) => console.error("[GGPower ERP] Unable to load Desk assets", error));
})();
