/**
 * Main entry point for the Seneca Extension content script
 * Initializes the extension and mounts the Vue app
 */

import App from "@/App.vue";
import { createApp } from "vue";
import { SenecaExtension } from "./index";

// Initialize extension when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeExtension();
  });
} else {
  initializeExtension();
}

/**
 * Initialize the extension and mount the Vue app
 */
function initializeExtension(): void {
  const extension = new SenecaExtension();

  // Set callback for when the container is ready
  extension.setReadyCallback((container: HTMLElement) => {
    // Create and mount Vue app
    const app = createApp(App);
    app.mount(container);
  });

  // Start observing the page
  extension.init();
}
