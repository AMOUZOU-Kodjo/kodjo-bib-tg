import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

function seoAssetsPlugin(env) {
  return {
    name: 'seo-assets',
    apply: 'build',
    async closeBundle() {
      const apiUrl = env.VITE_API_URL
      if (!apiUrl) return

      const base = apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
      const outDir = path.resolve(process.cwd(), 'dist')
      await mkdir(outDir, { recursive: true })

      await Promise.allSettled(['sitemap.xml', 'rss.xml'].map(async (filename) => {
        try {
          const response = await fetch(`${base}/${filename}`, { signal: AbortSignal.timeout(8000) })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const content = await response.text()
          if (!content.trim().startsWith('<?xml')) throw new Error('réponse XML invalide')
          await writeFile(path.join(outDir, filename), content, 'utf8')
          console.log(`seo: ${filename} récupéré depuis ${base}`)
        } catch (err) {
          console.warn(`seo: ${filename} non récupéré (${err.message})`)
        }
      }))
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), seoAssetsPlugin(env)]
  }
})
