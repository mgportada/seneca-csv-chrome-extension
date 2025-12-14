/**
 * Main content script that handles DOM injection and page observation
 */
export class SenecaExtension {
  private appContainer: HTMLDivElement | null = null;
  private onReady: ((container: HTMLElement) => void) | null = null;

  /**
   * Set callback when app container is ready
   */
  setReadyCallback(callback: (container: HTMLElement) => void): void {
    this.onReady = callback;
  }

  /**
   * Initialize the extension
   */
  init(): void {
    this.observePage();
  }

  /**
   * Observe page changes to inject UI
   */
  private observePage(): void {
    const tryInit = () => {
      const h1 = document.querySelector("h1");
      const table = document.querySelector("table");
      const h1Text = h1?.textContent?.trim() || "";
      if (!h1 || h1Text !== "CUADERNO DE CLASE" || !table) {
        return;
      }
      if (document.getElementById("seneca-extension-app")) {
        return;
      }
      this.injectUI(table);
    };

    tryInit();

    window.addEventListener("popstate", tryInit);
    window.addEventListener("hashchange", tryInit);

    const observer = new MutationObserver(tryInit);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Inject container into the page
   */
  private injectUI(table: Element): void {
    const parent = table.parentNode;
    if (!parent) return;

    // Create app container
    this.appContainer = document.createElement("div");
    this.appContainer.id = "seneca-extension-app";
    parent.insertBefore(this.appContainer, parent.firstChild);

    // Notify that container is ready
    if (this.onReady) {
      this.onReady(this.appContainer);
    }
  }
}
