# Cómo contribuir

## Modelo de ramas (GitFlow)

```
main ──●───────────────────────●──────────── (v0.1.0)   solo versiones publicadas
        \                     /
develop ─●──●──●──●──●──●──●──●──●──●──      integración continua
            \     /     \     /
 feature/x   ●──●        ●──●                 una funcionalidad por rama
                    release/0.1.0 ──●──●      estabilización → main + develop
 hotfix/y (desde main) ──●                    urgente → main + develop
```

| Rama | Para qué | Nace de | Se fusiona en |
|---|---|---|---|
| `main` | Lo publicado. Cada merge lleva una etiqueta `vX.Y.Z` | — | — |
| `develop` | Integración. **Todo el trabajo actual está aquí** | `main` | `release/*` |
| `feature/<área>-<tema>` | Una funcionalidad: `feature/roblox-noise-radar`, `feature/content-day4-script` | `develop` | `develop` |
| `release/<versión>` | Congelar y estabilizar: `release/0.1.0-ciclo-de-prueba` | `develop` | `main` y `develop` |
| `hotfix/<tema>` | Arreglo urgente en producción | `main` | `main` y `develop` |

**Áreas sugeridas:** `domain`, `roblox`, `steam`, `content`, `tools`, `backend`, `art`, `audio`, `docs`, `demo`.

## Reglas
1. Nadie hace push directo a `main` ni a `develop`: todo entra por **Pull Request** con CI verde y al menos **1 revisión**.
2. **Conventional Commits**: `feat(lucidity): señales por umbral`, `fix(net): rate limit de voz`, `docs(biblia): día 3`.
3. **SemVer**: `0.x` mientras no esté el Capítulo 1 completo.
4. El dominio (`domain/`) no importa nada del motor. Si lo necesitas, es un **puerto** (ver `docs/03-arquitectura`).
5. Nada de contenido "solo en Studio": la fuente de verdad es el repo (`content/`, `art/source`, `audio/`).
6. Archivos binarios grandes (`.blend`, `.wav`, `.psd`) con **Git LFS**.

## Pull Requests
Usa la plantilla (`.github/pull_request_template.md`): qué cambia, por qué, cómo probarlo y capturas o vídeo si es visual.
