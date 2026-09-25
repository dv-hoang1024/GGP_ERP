import { writeFile } from "node:fs/promises";

const port = process.env.GGP_CDP_PORT || "9229";
const user = process.env.GGP_TEST_USER || "Administrator";
const password = process.env.GGP_TEST_PASSWORD;
const screenshotPath = process.env.GGP_SCREENSHOT_PATH;

if (!password || !screenshotPath) {
	throw new Error("GGP_TEST_PASSWORD and GGP_SCREENSHOT_PATH are required");
}

const tabs = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const tab = tabs.find((item) => item.type === "page");
if (!tab) throw new Error("No headless browser page found");

const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
	socket.addEventListener("open", resolve, { once: true });
	socket.addEventListener("error", reject, { once: true });
});

let requestId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
	const message = JSON.parse(event.data);
	if (!message.id || !pending.has(message.id)) return;
	const { resolve, reject } = pending.get(message.id);
	pending.delete(message.id);
	if (message.error) reject(new Error(message.error.message));
	else resolve(message.result);
});

function send(method, params = {}) {
	requestId += 1;
	const id = requestId;
	socket.send(JSON.stringify({ id, method, params }));
	return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
	const result = await send("Runtime.evaluate", {
		expression,
		awaitPromise: true,
		returnByValue: true,
	});
	if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
	return result.result.value;
}

async function waitFor(expression, timeout = 20000) {
	const started = Date.now();
	while (Date.now() - started < timeout) {
		if (await evaluate(expression)) return;
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Timed out waiting for: ${expression}`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
	width: 1900,
	height: 950,
	deviceScaleFactor: 1,
	mobile: false,
});
await send("Page.navigate", { url: "http://ggpower.localhost:8002/login" });
await waitFor("document.readyState === 'complete'");

const loginResult = await evaluate(`(async () => {
	const response = await fetch('/api/method/login', {
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: new URLSearchParams({usr: ${JSON.stringify(user)}, pwd: ${JSON.stringify(password)}})
	});
	return response.status;
})()`);
if (loginResult !== 200) throw new Error(`Login failed with HTTP ${loginResult}`);

await send("Page.navigate", { url: "http://ggpower.localhost:8002/desk" });
await waitFor("document.readyState === 'complete'");
await waitFor("Boolean(document.querySelector('.gg-desk-intro') && document.querySelectorAll('.desktop-icon').length)");

const result = await evaluate(`(() => {
	const heading = document.querySelector('.gg-desk-intro h1');
	const wrapper = document.querySelector('.desktop-wrapper');
	const headingStyle = getComputedStyle(heading);
	const wrapperStyle = getComputedStyle(wrapper);
	return {
		title: heading.textContent.trim(),
		fontFamily: headingStyle.fontFamily,
		backgroundColor: wrapperStyle.backgroundColor,
		backgroundImage: wrapperStyle.backgroundImage,
		moduleCount: document.querySelectorAll('.desktop-icon').length,
		customIconCount: document.querySelectorAll('.gg-module-icon').length,
		moduleRoutes: Array.from(document.querySelectorAll('.desktop-icon')).map((icon) => ({
			id: icon.dataset.id,
			href: icon.getAttribute('href'),
		})),
		hasLegacyProductName: /ERPNext/.test(document.body.innerText),
		cssV6Loaded: Array.from(document.styleSheets).some((sheet) => sheet.href?.includes('gg_power_desk_v6.css')),
		jsV6Loaded: Array.from(document.scripts).some((script) => script.src.includes('gg_power_desk_v6.js')),
	};
})()`);
console.log(JSON.stringify(result));

await send("Page.navigate", { url: "http://ggpower.localhost:8002/app/manufacturing" });
await waitFor("document.readyState === 'complete'");
await waitFor("Boolean(document.querySelector('.sidebar-header .header-logo'))");
await waitFor("document.querySelector('.sidebar-header .header-subtitle')?.textContent.trim() === 'GGPower ERP'");
await waitFor("Boolean(document.querySelector('.sidebar-header .gg-sidebar-brand-logo')?.complete && document.querySelector('.sidebar-header .gg-sidebar-brand-logo')?.naturalWidth)");

const workspaceBranding = await evaluate(`(() => {
	const logo = document.querySelector('.sidebar-header .header-logo img');
	const subtitle = document.querySelector('.sidebar-header .header-subtitle');
	const visibleText = document.body.innerText;
	return {
		logoSrc: logo?.getAttribute('src') || '',
		logoAlt: logo?.getAttribute('alt') || '',
		logoLoaded: Boolean(logo?.complete && logo?.naturalWidth),
		subtitle: subtitle?.textContent.trim() || '',
		hasLegacyProductName: /ERPNext/.test(visibleText),
	};
})()`);

const brandingIsolation = await evaluate(`(async () => {
	const businessContent = document.createElement('div');
	businessContent.id = 'gg-test-business-content';
	businessContent.textContent = 'Customer note about ERPNext integration';

	const navbar = document.createElement('div');
	navbar.className = 'navbar';
	const title = document.createElement('span');
	title.className = 'menu-item-title';
	title.textContent = 'ERPNext Settings';
	navbar.append(title);

	const pageHead = document.createElement('div');
	pageHead.className = 'page-head';
	const recordTitle = document.createElement('span');
	recordTitle.className = 'title-text';
	recordTitle.textContent = 'ERPNext Settings';
	pageHead.append(recordTitle);
	document.body.append(businessContent, navbar, pageHead);

	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	title.setAttribute('aria-label', 'ERPNext Settings');
	const previousDocumentTitle = document.title;
	document.title = 'ERPNext Settings';
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

	const state = {
		businessText: businessContent.textContent,
		chromeText: title.textContent,
		chromeAriaLabel: title.getAttribute('aria-label'),
		pageHeadBusinessTitle: recordTitle.textContent,
		browserBusinessTitle: document.title,
	};
	document.title = previousDocumentTitle;
	businessContent.remove();
	navbar.remove();
	pageHead.remove();
	return state;
})()`);

await send("Page.navigate", { url: "http://ggpower.localhost:8002/desk/buying?sidebar=Buying" });
await waitFor("document.readyState === 'complete'");
await waitFor("document.querySelector('.sidebar-header .header-subtitle')?.textContent.trim() === 'GGPower ERP'");
await waitFor("Boolean(document.querySelector('.sidebar-header .gg-sidebar-brand-logo')?.complete && document.querySelector('.sidebar-header .gg-sidebar-brand-logo')?.naturalWidth)");

const secondWorkspaceBranding = await evaluate(`(() => ({
	subtitle: document.querySelector('.sidebar-header .header-subtitle')?.textContent.trim() || '',
	logoSrc: document.querySelector('.sidebar-header .header-logo img')?.getAttribute('src') || '',
	hasLegacyProductName: /ERPNext/.test(document.body.innerText),
}))()`);

const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
socket.close();

console.log(JSON.stringify(workspaceBranding));
console.log(JSON.stringify(brandingIsolation));
console.log(JSON.stringify(secondWorkspaceBranding));

if (/Georgia|Times New Roman/i.test(result.fontFamily)) throw new Error("Legacy serif font is active");
if (result.backgroundColor !== "rgb(255, 255, 255)") throw new Error("Desktop background is not white");
if (result.backgroundImage !== "none") throw new Error("Legacy patterned background is active");
if (!result.cssV6Loaded || !result.jsV6Loaded) throw new Error("Revisioned Desk assets are missing");
if (result.customIconCount !== result.moduleCount) throw new Error("Not all module icons were replaced");
if (result.hasLegacyProductName) throw new Error("Visible ERPNext branding remains on the Desk launcher");
if (!workspaceBranding.logoSrc.includes('/assets/gg_power/images/gg-power-logo.png')) {
	throw new Error("Workspace sidebar does not use the GG Power logo");
}
if (workspaceBranding.logoAlt !== "GG Power") throw new Error("Workspace logo alt text is incorrect");
if (!workspaceBranding.logoLoaded) throw new Error("Workspace logo image did not load");
if (workspaceBranding.subtitle !== "GGPower ERP") {
	throw new Error(`Unexpected workspace product name: ${workspaceBranding.subtitle}`);
}
if (workspaceBranding.hasLegacyProductName) {
	throw new Error("Visible ERPNext branding remains on the workspace page");
}
if (brandingIsolation.businessText !== "Customer note about ERPNext integration") {
	throw new Error("Business content was changed by the branding layer");
}
if (brandingIsolation.chromeText !== "GGPower ERP Settings") {
	throw new Error("Dynamically added interface branding was not replaced");
}
if (brandingIsolation.chromeAriaLabel !== "GGPower ERP Settings") {
	throw new Error("Dynamically changed interface accessibility text was not replaced");
}
if (brandingIsolation.pageHeadBusinessTitle !== "ERPNext Settings") {
	throw new Error("A business record title in the page header was changed by the branding layer");
}
if (brandingIsolation.browserBusinessTitle !== "ERPNext Settings") {
	throw new Error("A business record browser title was changed by the branding layer");
}
if (secondWorkspaceBranding.subtitle !== "GGPower ERP") {
	throw new Error("Second workspace product name was not replaced");
}
if (!secondWorkspaceBranding.logoSrc.includes('/assets/gg_power/images/gg-power-logo.png')) {
	throw new Error("Second workspace does not use the GG Power logo");
}
if (secondWorkspaceBranding.hasLegacyProductName) {
	throw new Error("Visible ERPNext branding remains on the second workspace page");
}
