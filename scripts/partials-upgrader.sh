#!/usr/bin/env bash

set -euo pipefail

usage() {
	printf 'Usage: %s <content-root-relative-path> [class: 1-5] [--list]\n' "$0" >&2
	printf '\n' >&2
	printf 'Classes (checked in priority order — highest complexity wins):\n' >&2
	printf '  1  plain static content — safe to upgrade directly\n' >&2
	printf '  2  uses {{variable}} parameters — automated upgrade possible\n' >&2
	printf '  3  includes other partials via (!...!) — includes must be upgraded first\n' >&2
	printf '  4  uses JSX components (<UpperCase ...>) — needs manual review\n' >&2
	printf '  5  examples/ directory (raw text, not MDX)\n' >&2
	printf '\n' >&2
	printf 'Without a class, prints a count of partials per class.\n' >&2
	printf 'With a class, upgrades matching partials (or lists them with --list).\n' >&2
}

if [[ $# -lt 1 || $# -gt 3 ]]; then
	usage
	exit 2
fi

content_root_relative_path="$1"

if [[ -z "$content_root_relative_path" || "$content_root_relative_path" == /* ]]; then
	printf 'Content root path must be a non-empty relative path.\n' >&2
	usage
	exit 2
fi

requested_class="${2:-}"
if [[ -n "$requested_class" && ! "$requested_class" =~ ^[1-5]$ ]]; then
	usage
	exit 2
fi

list=false
if [[ "${3:-}" == "--list" ]]; then
	list=true
elif [[ -n "${3:-}" ]]; then
	usage
	exit 2
fi

if [[ "$list" == true && -z "$requested_class" ]]; then
	printf '--list requires a class to be specified.\n' >&2
	usage
	exit 2
fi

# Read stdin before any subprocess can consume it. The classification loop
# uses a process substitution, not stdin, but some bash versions leave fd 0
# in an indeterminate state after the loop. Save it here to be safe.
piped_paths=""
if [[ ! -t 0 ]]; then
	piped_paths=$(cat)
fi

# Two-step cd so pwd resolves symlinks and .. components at each level.
content_root="$(cd "$content_root_relative_path" && pwd)"
docs_dir="$content_root/docs"

# Classes (checked in priority order — highest complexity wins):
#   5  examples/ directory (raw text, not MDX)
#   4  uses JSX components (<UpperCase ...>) — needs manual review
#   3  includes other partials via (!...!) — includes must be upgraded first
#   2  uses {{variable}} parameters — automated upgrade possible
#   1  plain static content — safe to upgrade directly
classify_partial() {
	local file="$1"

	if grep -Eq '<[A-Z][A-Za-z0-9_.]*([[:space:]]|/|>)' "$file"; then
		printf '4'
	elif grep -Eq '\(![^!]+!\)' "$file"; then
		printf '3'
	elif grep -Eq '\{\{[[:space:]]*[A-Za-z_][A-Za-z0-9_]*([[:space:]]*=|[[:space:]]*\}\})' "$file"; then
		printf '2'
	else
		printf '1'
	fi
}

counts=(0 0 0 0 0 0) # 1-indexed; index 0 is unused padding
matched_paths=()

if [[ ! -d "$docs_dir" ]]; then
	printf 'Docs directory not found under content root: %s\n' "$content_root_relative_path" >&2
	exit 1
fi

while IFS= read -r referenced_path; do
	[[ -n "$referenced_path" ]] || continue
	case "$referenced_path" in
		examples/*) class=5 ;; # raw text assets — skip file inspection
		includes/*) referenced_path="docs/pages/$referenced_path"; class="" ;;
		*) class="" ;; # expand short form to canonical path
	esac
	[[ -n "$class" ]] || class="$(classify_partial "$content_root/$referenced_path")"
	counts[$class]=$((counts[$class] + 1))
	if [[ -z "$requested_class" || "$class" == "$requested_class" ]]; then
		matched_paths+=("$referenced_path")
	fi
# Extract referenced partial paths from all docs files.
# grep -o emits only the matched fragment. sed strips the (! prefix, leading /, and short includes/ prefix.
# The final while loop filters out any referenced path that doesn't exist on disk (dead includes).
done < <(
	find "$docs_dir" -type f -print0 |
	xargs -0 grep -Eoh '\(![^![:space:]]+' 2>/dev/null |
	sed 's/^(!//' |
	sed 's#^/##' |
	sed 's#^includes/#docs/pages/includes/#' |
	sort -u |
	while IFS= read -r referenced_path; do
		[[ -f "$content_root/$referenced_path" ]] || continue
		printf '%s\n' "$referenced_path"
	done
)

script_dir="$(cd "$(dirname "$0")" && pwd)"

if [[ -n "$requested_class" ]]; then
	if [[ "$list" == true ]]; then
		# Subshell keeps IFS=, local; * expansion joins array elements with commas.
		(IFS=,; printf '%s\n' "${matched_paths[*]}")
	else
		(IFS=,; printf '%s\n' "${matched_paths[*]}") | node --experimental-strip-types "$script_dir/partials-upgrader.mts" "$content_root_relative_path"
	fi
elif [[ -n "$piped_paths" ]]; then
	# Paths were provided on stdin — bypass classification and upgrade directly.
	printf '%s\n' "$piped_paths" | node --experimental-strip-types "$script_dir/partials-upgrader.mts" "$content_root_relative_path"
else
	for class in 1 2 3 4 5; do
		printf '%s: %d\n' "$class" "${counts[$class]}"
	done
fi
