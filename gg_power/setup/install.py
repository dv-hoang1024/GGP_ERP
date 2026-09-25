import frappe


BRAND_NAME = "GG Power ERP"
BRAND_LOGO = "/assets/gg_power/images/gg-power-logo.png"


def after_install():
	apply_branding()


def apply_branding():
	"""Apply the GG Power identity through supported Frappe settings."""
	website_settings = frappe.get_single("Website Settings")
	website_settings.app_name = BRAND_NAME
	website_settings.app_logo = BRAND_LOGO
	website_settings.save(ignore_permissions=True)

	navbar_settings = frappe.get_single("Navbar Settings")
	navbar_settings.app_logo = BRAND_LOGO
	navbar_settings.save(ignore_permissions=True)

	frappe.clear_cache()
