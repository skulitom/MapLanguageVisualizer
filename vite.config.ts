import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const REPO_BASE = '/MapLanguageVisualizer/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages project site is served under /MapLanguageVisualizer/
  base: command === 'build' ? REPO_BASE : '/',
}))
