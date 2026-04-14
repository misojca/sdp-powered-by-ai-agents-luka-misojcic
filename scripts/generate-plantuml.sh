#!/usr/bin/env bash
# Generates an SVG for each staged .puml file passed as arguments.
# Requires: plantuml (java -jar plantuml.jar or system install)

set -euo pipefail

for puml_file in "$@"; do
  echo "Generating SVG for: $puml_file"
  plantuml -tsvg "$puml_file"
  svg_file="${puml_file%.puml}.svg"
  git add "$svg_file"
done
