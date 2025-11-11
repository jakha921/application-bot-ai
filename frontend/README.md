# Ariza AI SaaS - Frontend# React + TypeScript + Vite



Modern React + TypeScript frontend for Ariza AI Bot SaaS platform.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 Quick StartCurrently, two official plugins are available:



```bash- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

# Install dependencies- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

npm install

## React Compiler

# Start dev server (runs on http://localhost:5173)

npm run devThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



# Build for production## Expanding the ESLint configuration

npm run build

```If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



## 🛠 Tech Stack```js

export default defineConfig([

- React 18 + TypeScript  globalIgnores(['dist']),

- Vite 7.2  {

- Tailwind CSS v4    files: ['**/*.{ts,tsx}'],

- TanStack Query (server state)    extends: [

- Zustand (client state)      // Other configs...

- React Router v6

- Axios      // Remove tseslint.configs.recommended and replace with this

      tseslint.configs.recommendedTypeChecked,

## 📁 Project Structure      // Alternatively, use this for stricter rules

      tseslint.configs.strictTypeChecked,

```      // Optionally, add this for stylistic rules

src/      tseslint.configs.stylisticTypeChecked,

├── components/       # UI components

├── layouts/         # Page layouts      // Other configs...

├── pages/           # Route pages    ],

├── stores/          # Zustand stores    languageOptions: {

├── types/           # TypeScript types      parserOptions: {

├── lib/             # Utilities        project: ['./tsconfig.node.json', './tsconfig.app.json'],

└── App.tsx          # Root component        tsconfigRootDir: import.meta.dirname,

```      },

      // other options...

## 🔑 Features    },

  },

- ✅ Token-based authentication])

- ✅ Multi-tenant organization support```

- ✅ Protected routes

- ✅ State persistence (localStorage)You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

- ✅ Automatic API token injection

- ✅ Dark mode support```js

// eslint.config.js

## 🌐 Backend Integrationimport reactX from 'eslint-plugin-react-x'

import reactDom from 'eslint-plugin-react-dom'

Frontend → http://localhost:8000/api

export default defineConfig([

Key endpoints:  globalIgnores(['dist']),

- `POST /api/auth/login` - Login  {

- `POST /api/auth/register` - Register      files: ['**/*.{ts,tsx}'],

- `GET /api/organizations` - List orgs    extends: [

- `GET /api/subscriptions` - Subscriptions      // Other configs...

      // Enable lint rules for React

## 📝 Environment      reactX.configs['recommended-typescript'],

      // Enable lint rules for React DOM

Create `.env`:      reactDom.configs.recommended,

```    ],

VITE_API_BASE_URL=http://localhost:8000/api    languageOptions: {

```      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

## 🎨 Styling        tsconfigRootDir: import.meta.dirname,

      },

Uses Tailwind CSS v4 with `@import "tailwindcss"` syntax and `@theme` directive for design tokens.      // other options...

    },
  },
])
```
