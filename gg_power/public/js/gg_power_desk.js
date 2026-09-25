(function () {
	"use strict";

	const ASSET_LOGO = "/assets/gg_power/images/gg-power-logo.png";
	const LANGUAGE_API = "gg_power.api.set_language";

	function currentLanguage() {
		const language = window.frappe?.boot?.lang || document.documentElement.lang || "en";
		return language.toLowerCase().startsWith("vi") ? "vi" : "en";
	}

	function copy() {
		return currentLanguage() === "vi"
			? {
				title: "Trung tâm điều hành",
				subtitle: "Chọn phân hệ để bắt đầu công việc.",
				switchLabel: "EN",
				switchTitle: "Switch to English",
				loading: "Đang chuyển sang tiếng Anh...",
				nextLanguage: "en",
			  }
			: {
				title: "Operations desk",
				subtitle: "Choose a workspace to begin.",
				switchLabel: "VI",
				switchTitle: "Chuyển sang tiếng Việt",
				loading: "Đang chuyển sang tiếng Việt...",
				nextLanguage: "vi",
			  };
	}

	function switchLanguage(button) {
		const labels = copy();
		button.disabled = true;
		button.setAttribute("aria-busy", "true");

		frappe.call({
			method: LANGUAGE_API,
			args: { language: labels.nextLanguage },
			freeze: true,
			freeze_message: labels.loading,
			callback(response) {
				if (response.message?.language === labels.nextLanguage) {
					window.location.reload();
				}
			},
			always() {
				button.disabled = false;
				button.removeAttribute("aria-busy");
			},
		});
	}

	function makeLanguageButton(extraClass) {
		const labels = copy();
		const button = document.createElement("button");
		button.type = "button";
		button.className = `btn-reset gg-language-switch ${extraClass || ""}`.trim();
		button.textContent = labels.switchLabel;
		button.title = labels.switchTitle;
		button.setAttribute("aria-label", labels.switchTitle);
		button.addEventListener("click", () => switchLanguage(button));
		return button;
	}

	function enhanceDesktop() {
		const wrapper = document.querySelector(".desktop-wrapper");
		const container = wrapper?.querySelector(".desktop-container");
		if (!wrapper || !container) return;

		const logo = wrapper.querySelector("#brand-logo");
		if (logo) {
			logo.src = ASSET_LOGO;
			logo.alt = "GG Power";
		}

		if (!wrapper.querySelector(".gg-desk-intro")) {
			const labels = copy();
			const intro = document.createElement("section");
			intro.className = "gg-desk-intro";
			intro.setAttribute("aria-labelledby", "gg-desk-title");
			intro.innerHTML = `
				<div>
					<p class="gg-desk-kicker">GG POWER ERP</p>
					<h1 id="gg-desk-title">${labels.title}</h1>
					<p class="gg-desk-subtitle">${labels.subtitle}</p>
				</div>
				<div class="gg-desk-rule" aria-hidden="true"></div>`;
			container.before(intro);
		}

		wrapper.querySelectorAll(".desktop-icon").forEach((icon) => {
			if (icon.dataset.ggKeyboardReady) return;
			icon.dataset.ggKeyboardReady = "true";
			icon.tabIndex = 0;
			icon.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					icon.click();
				}
			});
		});

		const avatar = wrapper.querySelector(".desktop-avatar");
		if (avatar && !wrapper.querySelector(".gg-language-switch")) {
			avatar.before(makeLanguageButton("gg-language-switch--desktop"));
		}
	}

	function enhancePageHeader() {
		const actions = Array.from(
			document.querySelectorAll(".page-head .standard-items-section")
		).find((element) => element.offsetParent !== null);
		if (actions && !actions.querySelector(".gg-language-switch")) {
			actions.prepend(makeLanguageButton("gg-language-switch--page"));
		}
	}

	function init() {
		if (!window.frappe || !window.jQuery) {
			window.setTimeout(init, 100);
			return;
		}

		window.jQuery(document)
			.off("desktop_screen.gg_power page-change.gg_power toolbar_setup.gg_power")
			.on("desktop_screen.gg_power", enhanceDesktop)
			.on("page-change.gg_power toolbar_setup.gg_power", () => {
				window.setTimeout(enhancePageHeader, 0);
			});

		enhanceDesktop();
		enhancePageHeader();
	}

	init();
})();
