// vite.config.ts
import { defineConfig } from "file:///E:/Android/VibeUp/web/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Android/VibeUp/web/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Direct JioSaavn API proxy — lets the browser call api.php without CORS
      "/jiosaavn-search": {
        target: "https://www.jiosaavn.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/jiosaavn-search/, "/api.php")
      },
      "/audio-proxy-aac": {
        target: "https://aac.saavncdn.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-proxy-aac/, "")
      },
      "/audio-proxy-h": {
        target: "https://h.saavncdn.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-proxy-h/, "")
      },
      "/audio-proxy-c": {
        target: "https://c.saavncdn.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/audio-proxy-c/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxBbmRyb2lkXFxcXFZpYmVVcFxcXFx3ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXEFuZHJvaWRcXFxcVmliZVVwXFxcXHdlYlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovQW5kcm9pZC9WaWJlVXAvd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAvLyBEaXJlY3QgSmlvU2Fhdm4gQVBJIHByb3h5IFx1MjAxNCBsZXRzIHRoZSBicm93c2VyIGNhbGwgYXBpLnBocCB3aXRob3V0IENPUlNcbiAgICAgICcvamlvc2Fhdm4tc2VhcmNoJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL3d3dy5qaW9zYWF2bi5jb20nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2ppb3NhYXZuLXNlYXJjaC8sICcvYXBpLnBocCcpLFxuICAgICAgfSxcbiAgICAgICcvYXVkaW8tcHJveHktYWFjJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FhYy5zYWF2bmNkbi5jb20nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hdWRpby1wcm94eS1hYWMvLCAnJyksXG4gICAgICB9LFxuICAgICAgJy9hdWRpby1wcm94eS1oJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2guc2Fhdm5jZG4uY29tJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXVkaW8tcHJveHktaC8sICcnKSxcbiAgICAgIH0sXG4gICAgICAnL2F1ZGlvLXByb3h5LWMnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vYy5zYWF2bmNkbi5jb20nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hdWRpby1wcm94eS1jLywgJycpLFxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVAsU0FBUyxvQkFBb0I7QUFDdFIsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxNQUVMLG9CQUFvQjtBQUFBLFFBQ2xCLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxzQkFBc0IsVUFBVTtBQUFBLE1BQ2xFO0FBQUEsTUFDQSxvQkFBb0I7QUFBQSxRQUNsQixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsc0JBQXNCLEVBQUU7QUFBQSxNQUMxRDtBQUFBLE1BQ0Esa0JBQWtCO0FBQUEsUUFDaEIsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLG9CQUFvQixFQUFFO0FBQUEsTUFDeEQ7QUFBQSxNQUNBLGtCQUFrQjtBQUFBLFFBQ2hCLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxvQkFBb0IsRUFBRTtBQUFBLE1BQ3hEO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
