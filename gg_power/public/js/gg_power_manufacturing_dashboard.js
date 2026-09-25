(function () {
	"use strict";

	const DASHBOARD_CLASS = "gg-manufacturing-dashboard";
	const HOST_CLASS = "gg-manufacturing-dashboard-host";
	let scheduledRender = null;

	function isVietnamese() {
		return String(window.frappe?.boot?.lang || document.documentElement.lang || "en")
			.toLowerCase()
			.startsWith("vi");
	}

	function labels() {
		return isVietnamese()
			? {
				title: "Điều hành sản xuất",
				subtitle: "Theo dõi lệnh sản xuất, sản lượng và tiến độ công đoạn từ dữ liệu hiện tại.",
				refresh: "Làm mới dữ liệu",
				newWorkOrder: "Tạo lệnh sản xuất",
				newBom: "Tạo BOM",
				materialPlan: "Kế hoạch vật tư",
				openOrders: "Lệnh sản xuất mở",
				wipOrders: "Lệnh đang thực hiện",
				completedToday: "Hoàn thành hôm nay",
				completionRate: "Tỷ lệ hoàn thành",
				activeBoms: "BOM đang hoạt động",
				orders: "lệnh",
				productionOutput: "Sản lượng sản xuất",
				plan: "Kế hoạch",
				actual: "Thực tế",
				operationProgress: "Tiến độ công đoạn",
				runningOrders: "Lệnh sản xuất gần đây",
				viewAll: "Xem tất cả",
				orderCode: "Mã lệnh",
				product: "Sản phẩm",
				planned: "Kế hoạch",
				completed: "Hoàn thành",
				status: "Trạng thái",
				deadline: "Hạn hoàn thành",
				shortcuts: "Phím tắt",
				alerts: "Cảnh báo sản xuất",
				reports: "Báo cáo & danh mục",
				noData: "Chưa có dữ liệu phù hợp.",
				noAlerts: "Không có cảnh báo cần xử lý.",
				overdue: "Quá hạn nhưng chưa hoàn thành",
				quality: "Kết quả kiểm tra được chấp nhận",
				progress: "Khối lượng đã hoàn thành trên kế hoạch",
				active: "Định mức đang được sử dụng",
				updated: "Cập nhật",
			}
			: {
				title: "Manufacturing control",
				subtitle: "Monitor work orders, output and operation progress from current data.",
				refresh: "Refresh data",
				newWorkOrder: "Create work order",
				newBom: "Create BOM",
				materialPlan: "Material planning",
				openOrders: "Open work orders",
				wipOrders: "Work in progress",
				completedToday: "Completed today",
				completionRate: "Completion rate",
				activeBoms: "Active BOMs",
				orders: "orders",
				productionOutput: "Production output",
				plan: "Plan",
				actual: "Actual",
				operationProgress: "Operation progress",
				runningOrders: "Recent work orders",
				viewAll: "View all",
				orderCode: "Order",
				product: "Product",
				planned: "Planned",
				completed: "Completed",
				status: "Status",
				deadline: "Deadline",
				shortcuts: "Shortcuts",
				alerts: "Production alerts",
				reports: "Reports & masters",
				noData: "No matching data yet.",
				noAlerts: "There are no alerts to address.",
				overdue: "Overdue and not completed",
				quality: "Accepted inspection results",
				progress: "Completed quantity against plan",
				active: "Currently active definitions",
				updated: "Updated",
			};
	}

	function escapeHtml(value) {
		return String(value ?? "")
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#039;");
	}

	function icon(name, size = "sm") {
		return window.frappe?.utils?.icon?.(name, size) || "";
	}

	function number(value, maximumFractionDigits = 0) {
		return new Intl.NumberFormat(isVietnamese() ? "vi-VN" : "en-US", {
			maximumFractionDigits,
		}).format(Number(value) || 0);
	}

	function date(value) {
		if (!value) return "—";
		return window.frappe?.datetime?.str_to_user?.(String(value).slice(0, 10)) || String(value);
	}

	function isManufacturingOverview() {
		const parts = window.location.pathname.toLowerCase().split("/").filter(Boolean);
		return parts.at(-1) === "manufacturing";
	}

	async function safeGetList(doctype, options) {
		try {
			return await frappe.db.get_list(doctype, options);
		} catch (error) {
			console.warn(`[GGPower ERP] Unable to load ${doctype}`, error);
			return [];
		}
	}

	async function loadDashboardData() {
		const [workOrders, jobCards, boms, inspections] = await Promise.all([
			safeGetList("Work Order", {
				fields: [
					"name",
					"production_item",
					"item_name",
					"qty",
					"produced_qty",
					"status",
					"planned_start_date",
					"planned_end_date",
					"actual_end_date",
					"modified",
				],
				filters: [["docstatus", "=", 1]],
				order_by: "modified desc",
				limit: 240,
			}),
			safeGetList("Job Card", {
				fields: ["name", "work_order", "operation", "for_quantity", "total_completed_qty", "status"],
				filters: [["docstatus", "=", 1]],
				order_by: "modified desc",
				limit: 240,
			}),
			safeGetList("BOM", {
				fields: ["name", "item", "is_active", "is_default", "modified"],
				filters: [
					["docstatus", "=", 1],
					["is_active", "=", 1],
				],
				order_by: "modified desc",
				limit: 240,
			}),
			safeGetList("Quality Inspection", {
				fields: ["name", "status", "reference_type", "reference_name", "report_date"],
				filters: [["docstatus", "=", 1]],
				order_by: "report_date desc",
				limit: 240,
			}),
		]);

		return { workOrders, jobCards, boms, inspections };
	}

	function metricData(data, text) {
		const activeStatuses = new Set(["Not Started", "In Process"]);
		const today = frappe.datetime.get_today();
		const open = data.workOrders.filter((order) => activeStatuses.has(order.status));
		const wip = data.workOrders.filter((order) => order.status === "In Process");
		const completedToday = data.workOrders
			.filter((order) => String(order.actual_end_date || "").slice(0, 10) === today)
			.reduce((sum, order) => sum + (Number(order.produced_qty) || 0), 0);
		const totalQty = data.workOrders.reduce((sum, order) => sum + (Number(order.qty) || 0), 0);
		const producedQty = data.workOrders.reduce((sum, order) => sum + (Number(order.produced_qty) || 0), 0);
		const completionRate = totalQty ? Math.min(100, (producedQty / totalQty) * 100) : 0;
		const accepted = data.inspections.filter((inspection) => inspection.status === "Accepted").length;
		const qualityRate = data.inspections.length ? (accepted / data.inspections.length) * 100 : null;

		return [
			{ icon: "file-text", tone: "green", label: text.openOrders, value: number(open.length), help: `${number(open.length)} ${text.orders}` },
			{ icon: "settings", tone: "orange", label: text.wipOrders, value: number(wip.length), help: `${number(wip.length)} ${text.orders}` },
			{ icon: "box", tone: "blue", label: text.completedToday, value: number(completedToday, 2), help: text.updated },
			{ icon: "activity", tone: "green", label: text.completionRate, value: `${number(completionRate, 1)}%`, help: text.progress },
			{ icon: "layers", tone: "purple", label: text.activeBoms, value: number(data.boms.length), help: qualityRate === null ? text.active : `${number(qualityRate, 1)}% ${text.quality.toLowerCase()}` },
		];
	}

	function monthlyOutput(workOrders) {
		const formatter = new Intl.DateTimeFormat(isVietnamese() ? "vi-VN" : "en-US", { month: "short" });
		const now = new Date();
		const months = [];
		for (let offset = 5; offset >= 0; offset -= 1) {
			const value = new Date(now.getFullYear(), now.getMonth() - offset, 1);
			months.push({
				key: `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`,
				label: formatter.format(value),
				planned: 0,
				actual: 0,
			});
		}

		const byKey = new Map(months.map((month) => [month.key, month]));
		for (const order of workOrders) {
			const key = String(order.planned_start_date || order.modified || "").slice(0, 7);
			const month = byKey.get(key);
			if (!month) continue;
			month.planned += Number(order.qty) || 0;
			month.actual += Number(order.produced_qty) || 0;
		}

		return months;
	}

	function operationProgress(jobCards) {
		const operations = new Map();
		for (const card of jobCards) {
			const key = card.operation || (isVietnamese() ? "Chưa xác định" : "Unspecified");
			const current = operations.get(key) || { name: key, planned: 0, actual: 0 };
			current.planned += Number(card.for_quantity) || 0;
			current.actual += Number(card.total_completed_qty) || 0;
			operations.set(key, current);
		}

		return Array.from(operations.values())
			.map((operation) => ({
				...operation,
				percent: operation.planned ? Math.min(100, (operation.actual / operation.planned) * 100) : 0,
			}))
			.sort((a, b) => b.planned - a.planned)
			.slice(0, 5);
	}

	function statusClass(status) {
		const normalized = String(status || "").toLowerCase();
		if (normalized.includes("complete")) return "complete";
		if (normalized.includes("process")) return "progress";
		if (normalized.includes("stop") || normalized.includes("close")) return "stopped";
		return "pending";
	}

	function renderMetrics(metrics) {
		return metrics
			.map(
				(metric) => `
				<article class="gg-mfg-kpi gg-mfg-kpi--${metric.tone}">
					<span class="gg-mfg-kpi__icon" aria-hidden="true">${icon(metric.icon, "md")}</span>
					<span class="gg-mfg-kpi__copy">
						<span class="gg-mfg-kpi__label">${escapeHtml(metric.label)}</span>
						<strong>${escapeHtml(metric.value)}</strong>
						<small>${escapeHtml(metric.help)}</small>
					</span>
				</article>`
			)
			.join("");
	}

	function renderChart(months, text) {
		const maximum = Math.max(1, ...months.flatMap((month) => [month.planned, month.actual]));
		return `
			<div class="gg-mfg-chart" role="img" aria-label="${escapeHtml(text.productionOutput)}">
				${months
					.map((month) => {
						const plannedHeight = Math.max(2, (month.planned / maximum) * 100);
						const actualHeight = Math.max(2, (month.actual / maximum) * 100);
						return `<div class="gg-mfg-chart__month">
							<div class="gg-mfg-chart__bars">
								<span class="gg-mfg-chart__bar gg-mfg-chart__bar--plan" style="height:${plannedHeight}%" title="${escapeHtml(text.plan)}: ${number(month.planned, 2)}"></span>
								<span class="gg-mfg-chart__bar gg-mfg-chart__bar--actual" style="height:${actualHeight}%" title="${escapeHtml(text.actual)}: ${number(month.actual, 2)}"></span>
							</div>
							<span>${escapeHtml(month.label)}</span>
						</div>`;
					})
					.join("")}
			</div>`;
	}

	function renderOperations(operations, text) {
		if (!operations.length) return `<div class="gg-mfg-empty">${escapeHtml(text.noData)}</div>`;
		return operations
			.map(
				(operation) => `
				<div class="gg-mfg-operation">
					<span class="gg-mfg-operation__percent">${number(operation.percent)}%</span>
					<div class="gg-mfg-operation__body">
						<div><strong>${escapeHtml(operation.name)}</strong><span>${number(operation.actual, 2)} / ${number(operation.planned, 2)}</span></div>
						<div class="gg-mfg-progress"><span style="width:${operation.percent}%"></span></div>
					</div>
				</div>`
			)
			.join("");
	}

	function renderOrders(workOrders, text) {
		if (!workOrders.length) return `<div class="gg-mfg-empty">${escapeHtml(text.noData)}</div>`;
		return `<div class="gg-mfg-table-wrap"><table class="gg-mfg-table">
			<thead><tr>
				<th>${escapeHtml(text.orderCode)}</th><th>${escapeHtml(text.product)}</th><th>${escapeHtml(text.planned)}</th>
				<th>${escapeHtml(text.completed)}</th><th>${escapeHtml(text.status)}</th><th>${escapeHtml(text.deadline)}</th>
			</tr></thead>
			<tbody>${workOrders
				.slice(0, 7)
				.map((order) => {
					const qty = Number(order.qty) || 0;
					const produced = Number(order.produced_qty) || 0;
					const percent = qty ? Math.min(100, (produced / qty) * 100) : 0;
					return `<tr data-route="Form|Work Order|${escapeHtml(order.name)}" tabindex="0">
						<td><strong>${escapeHtml(order.name)}</strong></td>
						<td>${escapeHtml(order.item_name || order.production_item || "—")}</td>
						<td>${number(qty, 2)}</td>
						<td>${number(produced, 2)} <small>(${number(percent)}%)</small></td>
						<td><span class="gg-mfg-status gg-mfg-status--${statusClass(order.status)}">${escapeHtml(__(order.status || ""))}</span></td>
						<td>${escapeHtml(date(order.planned_end_date))}</td>
					</tr>`;
				})
				.join("")}</tbody>
		</table></div>`;
	}

	function renderAlerts(workOrders, text) {
		const today = frappe.datetime.get_today();
		const alerts = workOrders
			.filter((order) => order.planned_end_date && String(order.planned_end_date).slice(0, 10) < today && order.status !== "Completed")
			.slice(0, 4);
		if (!alerts.length) return `<div class="gg-mfg-empty gg-mfg-empty--success">${icon("check-circle", "sm")}${escapeHtml(text.noAlerts)}</div>`;
		return alerts
			.map(
				(order) => `<button type="button" class="gg-mfg-alert" data-route="Form|Work Order|${escapeHtml(order.name)}">
					<span aria-hidden="true">${icon("alert-triangle", "sm")}</span>
					<span><strong>${escapeHtml(order.name)}</strong><small>${escapeHtml(text.overdue)} · ${escapeHtml(date(order.planned_end_date))}</small></span>
					${icon("chevron-right", "sm")}
				</button>`
			)
			.join("");
	}

	function shortcut(iconName, title, subtitle, route, tone = "green") {
		return `<button type="button" class="gg-mfg-shortcut gg-mfg-shortcut--${tone}" data-route="${escapeHtml(route)}">
			<span class="gg-mfg-shortcut__icon" aria-hidden="true">${icon(iconName, "sm")}</span>
			<span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></span>
			${icon("chevron-right", "sm")}
		</button>`;
	}

	function renderDashboard(root, data) {
		const text = labels();
		const metrics = metricData(data, text);
		const months = monthlyOutput(data.workOrders);
		const operations = operationProgress(data.jobCards);
		const updatedAt = new Intl.DateTimeFormat(isVietnamese() ? "vi-VN" : "en-US", {
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date());

		root.innerHTML = `
			<header class="gg-mfg-header">
				<div><h1>${escapeHtml(text.title)}</h1><p>${escapeHtml(text.subtitle)}</p></div>
				<div class="gg-mfg-actions">
					<button type="button" class="gg-mfg-button gg-mfg-button--quiet" data-refresh title="${escapeHtml(text.refresh)}">${icon("refresh-cw", "sm")}<span>${escapeHtml(text.updated)} ${escapeHtml(updatedAt)}</span></button>
					<button type="button" class="gg-mfg-button gg-mfg-button--primary" data-new-doc="Work Order">${icon("plus", "sm")}<span>${escapeHtml(text.newWorkOrder)}</span></button>
					<button type="button" class="gg-mfg-button" data-new-doc="BOM">${icon("layers", "sm")}<span>${escapeHtml(text.newBom)}</span></button>
					<button type="button" class="gg-mfg-button" data-route="List|Material Request">${icon("calendar", "sm")}<span>${escapeHtml(text.materialPlan)}</span></button>
				</div>
			</header>
			<section class="gg-mfg-kpis" aria-label="KPI">${renderMetrics(metrics)}</section>
			<div class="gg-mfg-grid gg-mfg-grid--top">
				<section class="gg-mfg-panel gg-mfg-panel--chart">
					<header><div>${icon("bar-chart-2", "sm")}<h2>${escapeHtml(text.productionOutput)}</h2></div><div class="gg-mfg-legend"><span><i class="plan"></i>${escapeHtml(text.plan)}</span><span><i class="actual"></i>${escapeHtml(text.actual)}</span></div></header>
					${renderChart(months, text)}
				</section>
				<section class="gg-mfg-panel">
					<header><div>${icon("list", "sm")}<h2>${escapeHtml(text.operationProgress)}</h2></div></header>
					<div class="gg-mfg-operations">${renderOperations(operations, text)}</div>
				</section>
			</div>
			<div class="gg-mfg-grid gg-mfg-grid--middle">
				<section class="gg-mfg-panel">
					<header><div>${icon("file-text", "sm")}<h2>${escapeHtml(text.runningOrders)}</h2></div><button type="button" data-route="List|Work Order">${escapeHtml(text.viewAll)}</button></header>
					${renderOrders(data.workOrders, text)}
				</section>
				<section class="gg-mfg-panel">
					<header><div>${icon("zap", "sm")}<h2>${escapeHtml(text.shortcuts)}</h2></div></header>
					<div class="gg-mfg-shortcuts">
						${shortcut("file-plus", text.newWorkOrder, isVietnamese() ? "Lập lệnh sản xuất mới" : "Start a new production order", "new:Work Order")}
						${shortcut("layers", text.newBom, isVietnamese() ? "Định mức nguyên vật liệu" : "Bill of materials", "new:BOM", "blue")}
						${shortcut("clipboard", isVietnamese() ? "Đơn hàng công việc" : "Work orders", isVietnamese() ? "Quản lý và theo dõi" : "Manage and track", "List|Work Order", "purple")}
						${shortcut("activity", isVietnamese() ? "Thẻ công việc" : "Job cards", isVietnamese() ? "Tiến độ công đoạn" : "Operation progress", "List|Job Card", "orange")}
					</div>
				</section>
			</div>
			<div class="gg-mfg-grid gg-mfg-grid--bottom">
				<section class="gg-mfg-panel gg-mfg-panel--alerts">
					<header><div>${icon("bell", "sm")}<h2>${escapeHtml(text.alerts)}</h2></div></header>
					<div>${renderAlerts(data.workOrders, text)}</div>
				</section>
				<section class="gg-mfg-panel">
					<header><div>${icon("database", "sm")}<h2>${escapeHtml(text.reports)}</h2></div></header>
					<div class="gg-mfg-master-links">
						${shortcut("factory", isVietnamese() ? "Sản xuất" : "Manufacturing", isVietnamese() ? "Lệnh và kế hoạch sản xuất" : "Orders and production plans", "List|Work Order")}
						${shortcut("box", "BOM", isVietnamese() ? "Định mức nguyên vật liệu" : "Bills of materials", "List|BOM", "orange")}
						${shortcut("shield-check", isVietnamese() ? "Kiểm tra chất lượng" : "Quality inspections", isVietnamese() ? "Kết quả và tiêu chuẩn" : "Results and standards", "List|Quality Inspection", "purple")}
					</div>
				</section>
			</div>`;
	}

	function activate(root) {
		root.addEventListener("click", async (event) => {
			const target = event.target.closest("[data-route], [data-new-doc], [data-refresh]");
			if (!target) return;
			if (target.dataset.refresh !== undefined) {
				target.disabled = true;
				await refresh(root);
				return;
			}
			if (target.dataset.newDoc) {
				frappe.new_doc(target.dataset.newDoc);
				return;
			}
			const route = target.dataset.route;
			if (route?.startsWith("new:")) {
				frappe.new_doc(route.slice(4));
				return;
			}
			if (route) frappe.set_route(...route.split("|"));
		});

		root.addEventListener("keydown", (event) => {
			if ((event.key === "Enter" || event.key === " ") && event.target.matches("tr[data-route]")) {
				event.preventDefault();
				frappe.set_route(...event.target.dataset.route.split("|"));
			}
		});
	}

	async function refresh(root) {
		root.setAttribute("aria-busy", "true");
		const data = await loadDashboardData();
		if (!root.isConnected) return;
		renderDashboard(root, data);
		root.removeAttribute("aria-busy");
	}

	function visibleMainSection() {
		return Array.from(document.querySelectorAll(".layout-main-section")).find(
			(element) => element.offsetParent !== null
		);
	}

	function mount() {
		if (!isManufacturingOverview()) {
			document.body.classList.remove("gg-manufacturing-dashboard-page");
			document.querySelectorAll(`.${HOST_CLASS}`).forEach((host) => host.classList.remove(HOST_CLASS));
			return;
		}
		document.body.classList.add("gg-manufacturing-dashboard-page");

		const host = visibleMainSection();
		if (!host) {
			window.setTimeout(schedule, 120);
			return;
		}

		host.classList.add(HOST_CLASS);
		let root = host.querySelector(`:scope > .${DASHBOARD_CLASS}`);
		if (root) return;

		root = document.createElement("main");
		root.className = DASHBOARD_CLASS;
		root.setAttribute("aria-live", "polite");
		root.setAttribute("aria-busy", "true");
		root.innerHTML = `<div class="gg-mfg-loading"><span></span><span></span><span></span></div>`;
		host.prepend(root);
		activate(root);
		refresh(root);
	}

	function schedule() {
		if (scheduledRender !== null) return;
		scheduledRender = window.requestAnimationFrame(() => {
			scheduledRender = null;
			mount();
		});
	}

	function init() {
		if (!window.frappe || !window.jQuery || !document.body) {
			window.setTimeout(init, 100);
			return;
		}

		window.jQuery(document)
			.off("page-change.gg_power_manufacturing")
			.on("page-change.gg_power_manufacturing", () => window.setTimeout(schedule, 80));

		new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
		schedule();
	}

	init();
})();
