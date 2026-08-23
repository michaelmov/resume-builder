#!/usr/bin/env bash
# PostToolUse (Write|Edit): format the file that was just written, and flag the
# tree as needing verification if that file was source code.
#
# This never fails the tool call. Formatting is a fix, not a gate — there is
# nothing for an agent to decide about it, so it happens silently and the
# end-of-turn check in verify.sh is left to report things that need judgement.
set -uo pipefail

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

file=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null) || exit 0
[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

# --ignore-unknown makes a PNG or any file Prettier has no parser for a no-op
# instead of an error. .prettierignore is still honoured, so build output and
# vendored files are skipped.
npx --no-install prettier --write --ignore-unknown "$file" >/dev/null 2>&1 || true

# Only source edits are worth running lint and the test suite over. Editing a
# markdown doc should not cost a full verification pass.
case "$file" in
  *.ts | *.tsx | *.js | *.jsx)
    git_dir=$(git rev-parse --git-dir 2>/dev/null) || exit 0
    # Inside .git so it is never committed and never shows up in git status.
    : >"$git_dir/claude-verify-pending"
    ;;
esac

exit 0
