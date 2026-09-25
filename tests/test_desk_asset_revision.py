import unittest
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[1]


class TestDeskAssetRevision(unittest.TestCase):
	def test_desk_hooks_use_revisioned_entry_points(self):
		hooks = (APP_ROOT / "gg_power" / "hooks.py").read_text(encoding="utf-8")

		self.assertIn("/assets/gg_power/css/gg_power_desk_v6.css", hooks)
		self.assertIn("/assets/gg_power/js/gg_power_desk_v6.js", hooks)

	def test_revisioned_assets_force_fresh_base_assets(self):
		css_entry = (APP_ROOT / "gg_power" / "public" / "css" / "gg_power_desk_v6.css").read_text(
			encoding="utf-8"
		)
		js_entry = (APP_ROOT / "gg_power" / "public" / "js" / "gg_power_desk_v6.js").read_text(
			encoding="utf-8"
		)

		self.assertIn("gg_power_desk.css?revision=", css_entry)
		self.assertIn("gg_power_desk.js?revision=", js_entry)

	def test_corrected_theme_has_no_legacy_serif_or_ivory_grid(self):
		css = (APP_ROOT / "gg_power" / "public" / "css" / "gg_power_desk.css").read_text(
			encoding="utf-8"
		)

		self.assertNotIn("Georgia", css)
		self.assertNotIn("background-size: 32px 32px", css)
		self.assertIn("background: var(--gg-white)", css)


if __name__ == "__main__":
	unittest.main()
