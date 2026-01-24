import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // 💡 ADD THIS SECTION TO CONFIGURE THE PROXY 💡
  server: {
    proxy: {
      // Intercepts all API calls starting with /api/
      '/api': {
        // !!! IMPORTANT: CHANGE THIS TO YOUR ACTUAL ASP.NET CORE API URL/PORT !!!
        target: 'https://localhost:5282', 
        
        // This is necessary when proxying between different protocols/ports
        changeOrigin: true, 
        
        // Use this if your backend uses a self-signed certificate (common for local HTTPS)
        secure: false, 
      },
    }
  }
})