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
		cssV2Loaded: Array.from(document.styleSheets).some((sheet) => sheet.href?.includes('gg_power_desk_v2.css')),
		jsV2Loaded: Array.from(document.scripts).some((script) => script.src.includes('gg_power_desk_v2.js')),
	};
})()`);

const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
socket.close();

console.log(JSON.stringify(result));

if (/Georgia|Times New Roman/i.test(result.fontFamily)) throw new Error("Legacy serif font is active");
if (result.backgroundColor !== "rgb(255, 255, 255)") throw new Error("Desktop background is not white");
if (result.backgroundImage !== "none") throw new Error("Legacy patterned background is active");
if (!result.cssV2Loaded || !result.jsV2Loaded) throw new Error("Revisioned Desk assets are missing");
if (result.customIconCount !== result.moduleCount) throw new Error("Not all module icons were replaced");
