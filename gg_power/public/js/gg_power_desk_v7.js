(function () {
	"use strict";

	const source = "/assets/gg_power/js/gg_power_desk.js?revision=20260925-7";
	if (document.querySelector(`script[src="${source}"]`)) return;

	const script = document.createElement("script");
	script.src = source;
	script.async = false;
	document.head.appendChild(script);
})();
