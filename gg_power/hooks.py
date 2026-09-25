app_name = "gg_power"
app_title = "GG Power"
app_publisher = "hoangdv"
app_description = "GG Power ERP"
app_email = "hoangdv@ggp.vn"
app_license = "mit"

# GG Power brand assets
# ---------------------

# Used by Frappe as a fallback when no site-level logo has been configured.
app_logo_url = "/assets/gg_power/images/gg-power-logo.png"

# The stylesheet is scoped to body[data-path="login"], so other website pages
# retain their native Frappe/ERPNext appearance.
web_include_css = ["/assets/gg_power/css/gg_power_login.css"]
web_include_js = ["/assets/gg_power/js/gg_power_login.js"]

# Desk shell, desktop launcher and bilingual controls.
app_include_css = ["/assets/gg_power/css/gg_power_desk_v2.css"]
app_include_js = ["/assets/gg_power/js/gg_power_desk_v2.js"]

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "gg_power",
# 		"logo": "/assets/gg_power/logo.png",
# 		"title": "GG Power",
# 		"route": "/gg_power",
# 		"has_permission": "gg_power.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/gg_power/css/gg_power.css"
# app_include_js = "/assets/gg_power/js/gg_power.js"

# include js, css files in header of web template
# web_include_css = "/assets/gg_power/css/gg_power.css"
# web_include_js = "/assets/gg_power/js/gg_power.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "gg_power/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "gg_power/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# automatically load and sync documents of this doctype from downstream apps
# importable_doctypes = [doctype_1]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "gg_power.utils.jinja_methods",
# 	"filters": "gg_power.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "gg_power.install.before_install"
after_install = "gg_power.setup.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "gg_power.uninstall.before_uninstall"
# after_uninstall = "gg_power.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "gg_power.utils.before_app_install"
# after_app_install = "gg_power.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "gg_power.utils.before_app_uninstall"
# after_app_uninstall = "gg_power.utils.after_app_uninstall"

# Build
# ------------------
# To hook into the build process

# after_build = "gg_power.build.after_build"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "gg_power.notifications.get_notification_config"

# Awesome Bar
# -----------
# Extra search results: list of dicts with label, description, route, index.
# route: ["List", "ToDo"], "/desk/docs/some/page", or "https://example.com"
# awesomebar_search = ["gg_power.search.awesomebar_results"]

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"gg_power.tasks.all"
# 	],
# 	"daily": [
# 		"gg_power.tasks.daily"
# 	],
# 	"hourly": [
# 		"gg_power.tasks.hourly"
# 	],
# 	"weekly": [
# 		"gg_power.tasks.weekly"
# 	],
# 	"monthly": [
# 		"gg_power.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "gg_power.install.before_tests"

# Extend DocType Class
# ------------------------------
#
# Specify custom mixins to extend the standard doctype controller.
# extend_doctype_class = {
# 	"Task": "gg_power.custom.task.CustomTaskMixin"
# }

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "gg_power.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "gg_power.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["gg_power.utils.before_request"]
# after_request = ["gg_power.utils.after_request"]

# Job Events
# ----------
# before_job = ["gg_power.utils.before_job"]
# after_job = ["gg_power.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"gg_power.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

# Translation
# ------------
# List of apps whose translatable strings should be excluded from this app's translations.
# ignore_translatable_strings_from = []
