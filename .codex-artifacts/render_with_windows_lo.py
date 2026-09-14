import os
import runpy
import sys


if len(sys.argv) < 2:
    raise SystemExit("Usage: render_with_windows_lo.py <render_docx.py> [args]")

renderer = sys.argv[1]
sys.argv = [renderer, *sys.argv[2:]]
os.environ["PATH"] = os.pathsep.join([
    r"C:\Program Files\LibreOffice\program",
    r"C:\Users\Usuario\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin",
    os.environ.get("PATH", ""),
])
runpy.run_path(renderer, run_name="__main__")
