#!/usr/bin/env bash
# Copia la fuente única (mapa y modelos v0.1.0) a la demo web.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p demo/data demo/models
cp content/mapa/eden0.json demo/data/eden0.json
cp art/models/*.glb demo/models/
echo "demo sincronizada: $(ls demo/models | tr '\n' ' ')"
python3 tools/export_web_models.py
