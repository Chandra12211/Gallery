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
      resolve: {
        // Ensure React is resolved correctly
        dedupe: ['react', 'react-dom'],
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
          // DON'T externalize React - bundle it inside
          output: {
            // Ensure styles are extracted with correct name
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'react-gallery.min.css'
              }
              return assetInfo.name || '[name].[ext]'
            },
            // Export only named exports
            exports: 'named',
            // Ensure proper global scope
            extend: true,
          },
        },
        // Output to dist folder
        outDir: 'dist',
        // Generate sourcemaps for debugging
        sourcemap: false,
        // Minify for production
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: false, // Keep console for debugging
            drop_debugger: true,
          },
        },
        // Empty the output directory
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
