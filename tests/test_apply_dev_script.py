import json
import shutil
import subprocess
import unittest
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = APP_ROOT / "scripts" / "apply-ggpower-dev.ps1"


class TestApplyDevScript(unittest.TestCase):
	def test_validate_only_returns_the_local_deployment_plan(self):
		powershell = shutil.which("pwsh") or shutil.which("powershell")
		self.assertIsNotNone(powershell, "PowerShell is required for this test")

		result = subprocess.run(
			[
				powershell,
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				str(SCRIPT),
				"-ValidateOnly",
			],
			cwd=APP_ROOT,
			capture_output=True,
			text=True,
			encoding="utf-8",
			check=False,
		)

		self.assertEqual(result.returncode, 0, result.stderr or result.stdout)
		plan = json.loads(result.stdout)
		self.assertEqual(plan["container"], "devcontainer-frappe-1")
		self.assertEqual(plan["site"], "ggpower.localhost")
		self.assertEqual(plan["url"], "http://ggpower.localhost:8002")
		self.assertEqual(plan["source"], str(APP_ROOT / "gg_power"))


if __name__ == "__main__":
	unittest.main()
