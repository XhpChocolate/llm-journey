#!/bin/sh
# 本机沙箱里 Chrome 需要这几个参数才能无头启动（crashpad 会写只读目录而崩溃）。
# 用法: CHROME_PATH="$PWD/tools/chrome-wrap.sh" node <script>
exec "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --no-sandbox --disable-gpu --disable-crash-reporter --disable-breakpad \
  --crash-dumps-dir=/tmp/xuetai-crash --disable-dev-shm-usage "$@"
