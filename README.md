# Backend (Node + Express + TypeScript)

Este directorio ya está listo para construir la API que consumirá el frontend:

## Scripts disponibles

- `npm install` – instala dependencias.
- `npm run dev` – levanta el servidor en modo watch usando `tsx`.
- `npm run build` – compila TypeScript a JavaScript en `dist/`.
- `npm start` – ejecuta el build compilado.
- `npm run lint` – revisa el código con ESLint.

## Estructura base

```
backend/
├─ src/
│  └─ server.ts      # Express + rutas de ejemplo (/ y /health)
├─ package.json
├─ tsconfig.json
└─ .eslintrc.cjs
```

Puedes comenzar agregando controladores, rutas y servicios dentro de `src/`. Ajusta la URL base del frontend cuando el backend esté escuchando (por defecto `http://localhost:4000`).
