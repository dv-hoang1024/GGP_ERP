import frappe
from frappe import _


SUPPORTED_LANGUAGES = {"en", "vi"}


@frappe.whitelist()
def set_language(language: str):
	"""Set the signed-in user's Desk language and refresh their locale defaults."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Please log in to change language."), frappe.PermissionError)

	language = (language or "").strip().lower()
	if language not in SUPPORTED_LANGUAGES:
		frappe.throw(_("Unsupported language."), frappe.ValidationError)

	user = frappe.get_doc("User", frappe.session.user)
	if user.language != language:
		user.language = language
		user.save(ignore_permissions=True)

	return {"language": language}
