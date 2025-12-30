import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Check if building for plugin (library mode)
  const isPluginBuild = mode === 'plugin'
  
  if (isPluginBuild) {
    return {
      plugins: [react()],
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        lib: {
          entry: resolve(__dirname, 'src/plugin/index.tsx'),
          name: 'ReactGallery',
          formats: ['iife'],
          fileName: () => 'react-gallery.min.js',
        },
        // Inline dynamic imports for IIFE
        inlineDynamicImports: true,
        rollupOptions: {
          // Externalize React and ReactDOM - they will be loaded from CDN
          external: ['react', 'react-dom', 'react/jsx-runtime'],
          output: {
            // Global variable names for externalized dependencies
            globals: {
              'react': 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'React',
            },
            // Ensure styles are extracted with correct name
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'react-gallery.min.css'
              }
              return assetInfo.name || '[name].[ext]'
            },
            // Export only named exports (not default)
            exports: 'named',
          },
        },
        // Output to dist folder
        outDir: 'dist',
        // Generate sourcemaps for debugging
        sourcemap: true,
        // Minify for production
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        // Don't empty the output directory (in case we have other builds)
        emptyOutDir: true,
        // CSS code splitting disabled for single CSS file
        cssCodeSplit: false,
      },
    }
  }
  
  // Default development/production build
  return {
    plugins: [react()],
  }
})
