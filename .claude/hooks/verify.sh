#!/usr/bin/env bash
# Stop / SubagentStop: run the same checks the pre-commit hook runs, but only
# when an agent actually edited source during the turn.
#
# Exits 2 on failure, which feeds the output back to the agent so it keeps
# working instead of handing over broken code. This terminates on its own: the
# sentinel is only recreated by a source edit, so an agent that stops editing
# gets a clean pass on the next Stop rather than looping forever.
set -uo pipefail

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$repo_root" || exit 0

git_dir=$(git rev-parse --git-dir 2>/dev/null) || exit 0
sentinel="$git_dir/claude-verify-pending"

# No source edits this turn — nothing to verify.
[ -f "$sentinel" ] || exit 0

# Cleared up front: the checks must not re-trigger themselves, and a crash
# below must not wedge every future turn behind a stale sentinel.
rm -f "$sentinel"

# Matches .husky/pre-commit: `npm run lint` tolerates the known `any` warnings,
# `lint:check` would not.
if ! output=$(npm run lint 2>&1); then
  printf 'Lint failed — fix before finishing:\n\n%s\n' "$(printf '%s' "$output" | tail -60)" >&2
  exit 2
fi

if ! output=$(npm test 2>&1); then
  printf 'Tests failed — fix before finishing:\n\n%s\n' "$(printf '%s' "$output" | tail -60)" >&2
  exit 2
fi

exit 0
