(function () {
	"use strict";

	const ASSET_LOGO = "/assets/gg_power/images/gg-power-logo.png";
	const BRAND_NAME = "GGPower ERP";
	const LANGUAGE_API = "gg_power.api.set_language";
	const MODULE_ICONS = {
		Framework: "box",
		Organization: "network",
		Accounting: "calculator",
		Assets: "boxes",
		Buying: "tag",
		Manufacturing: "factory",
		Projects: "presentation",
		Quality: "shield-check",
		Selling: "receipt-text",
		Stock: "warehouse",
		Subcontracting: "refresh-cw",
		"ERPNext Settings": "settings",
	};
	const MODULE_ALIASES = new Map([
		["framework", "Framework"],
		["nen tang", "Framework"],
		["organization", "Organization"],
		["company", "Organization"],
		["to chuc", "Organization"],
		["accounting", "Accounting"],
		["ke toan", "Accounting"],
		["assets", "Assets"],
		["tai san", "Assets"],
		["buying", "Buying"],
		["mua hang", "Buying"],
		["manufacturing", "Manufacturing"],
		["san xuat", "Manufacturing"],
		["projects", "Projects"],
		["du an", "Projects"],
		["quality", "Quality"],
		["chat luong", "Quality"],
		["selling", "Selling"],
		["ban hang", "Selling"],
		["stock", "Stock"],
		["warehouse", "Stock"],
		["kho", "Stock"],
		["subcontracting", "Subcontracting"],
		["gia cong", "Subcontracting"],
		["erpnext settings", "ERPNext Settings"],
		["ggpower erp settings", "ERPNext Settings"],
		["global-defaults", "ERPNext Settings"],
		["cai dat erpnext", "ERPNext Settings"],
		["cai dat ggpower erp", "ERPNext Settings"],
	]);
	const BRANDABLE_ATTRIBUTES = ["title", "aria-label", "placeholder"];
	const EXCLUDED_TEXT_CONTAINERS = "script, style, code, pre, textarea";
	const BRAND_LABEL_REPLACEMENTS = new Map([
		["ERPNext", BRAND_NAME],
		["ERPNext Settings", `${BRAND_NAME} Settings`],
		["Cài đặt ERPNext", `Cài đặt ${BRAND_NAME}`],
	]);
	const BRANDING_TEXT_SELECTORS = [
		".sidebar-header .header-title",
		".sidebar-header .header-subtitle",
		".sidebar-header-menu .menu-item-title",
		".desktop-wrapper .icon-title",
		".navbar .menu-item-title",
		".app-switcher .app-title",
	].join(",");

	function replaceBrandLabel(value) {
		if (typeof value !== "string") return value;
		const label = value.trim();
		const replacement = BRAND_LABEL_REPLACEMENTS.get(label);
		return replacement ? value.replace(label, replacement) : value;
	}

	function enhanceBrandMetadata() {
		for (const app of window.frappe?.boot?.app_data || []) {
			if (app.app_name === "erpnext" || app.app_title?.includes("ERPNext")) {
				app.app_title = BRAND_NAME;
				app.app_logo_url = ASSET_LOGO;
			}
		}
	}

	function replaceBrandingInElement(element) {
		const replaceTextNode = (node) => {
			if (!node.nodeValue) return;
			if (node.parentElement?.closest(EXCLUDED_TEXT_CONTAINERS)) return;
			const brandedValue = replaceBrandLabel(node.nodeValue);
			if (node.nodeValue !== brandedValue) node.nodeValue = brandedValue;
		};

		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		let node;
		while ((node = walker.nextNode())) replaceTextNode(node);

		for (const attribute of BRANDABLE_ATTRIBUTES) {
			if (!element.hasAttribute(attribute)) continue;
			const value = element.getAttribute(attribute);
			const brandedValue = replaceBrandLabel(value);
			if (value !== brandedValue) {
				element.setAttribute(attribute, brandedValue);
			}
		}
	}

	function replaceVisibleBranding() {
		document.querySelectorAll(BRANDING_TEXT_SELECTORS).forEach(replaceBrandingInElement);
	}

	function normalizeModuleAlias(value) {
		return String(value || "")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/đ/gi, "d")
			.trim()
			.toLowerCase();
	}

	function resolveSidebarModule(header) {
		const candidates = [
			new URLSearchParams(window.location.search).get("sidebar"),
			...(window.frappe?.get_route?.() || []),
			...window.location.pathname.split("/").filter(Boolean).reverse(),
			header.querySelector(".header-title")?.textContent,
		];

		for (const candidate of candidates) {
			const moduleId = MODULE_ALIASES.get(normalizeModuleAlias(candidate));
			if (moduleId) return moduleId;
		}

		return null;
	}

	function enhanceSidebarBranding() {
		document.querySelectorAll(".sidebar-header").forEach((header) => {
			const logoContainer = header.querySelector(".header-logo");
			const iconContainer = header.querySelector(".sidebar-item-icon");
			const moduleId = resolveSidebarModule(header);
			const iconName = MODULE_ICONS[moduleId];
			if (logoContainer && iconName && logoContainer.dataset.ggModuleIcon !== iconName) {
				logoContainer.innerHTML = frappe.utils.icon(iconName, "md");
				logoContainer.dataset.ggModuleIcon = iconName;
				logoContainer.classList.remove("gg-sidebar-brand-mark");
				logoContainer.classList.add("gg-sidebar-module-mark");
				logoContainer.setAttribute("aria-hidden", "true");
				logoContainer.querySelector("svg")?.setAttribute("aria-hidden", "true");
				iconContainer?.classList.remove("gg-sidebar-brand-icon");
				iconContainer?.classList.add("gg-sidebar-module-icon");
				iconContainer?.style.removeProperty("background-color");
			}

			const subtitle = header.querySelector(".header-subtitle");
			if (subtitle && subtitle.textContent.trim() !== BRAND_NAME) {
				subtitle.textContent = BRAND_NAME;
			}
		});
	}

	function enhanceProductBranding() {
		enhanceBrandMetadata();
		enhanceSidebarBranding();
		replaceVisibleBranding();
	}

	function observeProductBranding() {
		if (!document.body || document.body.dataset.ggBrandObserverReady) return;
		document.body.dataset.ggBrandObserverReady = "true";
		let pendingFrame = null;

		const observer = new MutationObserver(() => {
			if (pendingFrame !== null) return;
			pendingFrame = window.requestAnimationFrame(() => {
				pendingFrame = null;
				enhanceProductBranding();
			});
		});

		observer.observe(document.body, {
			attributes: true,
			attributeFilter: BRANDABLE_ATTRIBUTES,
			childList: true,
			characterData: true,
			subtree: true,
		});
	}

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
				<h1 id="gg-desk-title">${labels.title}</h1>
				<p class="gg-desk-subtitle">${labels.subtitle}</p>`;
			container.before(intro);
		}

		wrapper.querySelectorAll(".desktop-icon").forEach((icon) => {
			const iconName = MODULE_ICONS[icon.dataset.id];
			const iconContainer = icon.querySelector(".icon-container");
			if (iconName && iconContainer && !iconContainer.classList.contains("gg-module-icon")) {
				iconContainer.classList.add("gg-module-icon");
				iconContainer.innerHTML = frappe.utils.icon(iconName, "md");
				iconContainer.querySelector("svg")?.setAttribute("aria-hidden", "true");
			}

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

		enhanceBrandMetadata();

		window.jQuery(document)
			.off("desktop_screen.gg_power page-change.gg_power toolbar_setup.gg_power")
			.on("desktop_screen.gg_power", enhanceDesktop)
			.on("page-change.gg_power toolbar_setup.gg_power", () => {
				window.setTimeout(() => {
					enhancePageHeader();
					enhanceProductBranding();
				}, 0);
			});

		enhanceDesktop();
		enhancePageHeader();
		enhanceProductBranding();
		observeProductBranding();
	}

	init();
})();
