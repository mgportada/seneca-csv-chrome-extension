import Toolbar from "@/components/Toolbar.vue";
import UploadModal from "@/components/UploadModal.vue";
import type { UploadProgress } from "@/types";
import { createApp } from "vue";
import { DownloadHandler } from "./DownloadHandler";
import { UploadHandler } from "./UploadHandler";

interface ModalState {
  visible: boolean;
  title: string;
  current: number;
  total: number;
  logs: Array<{ message: string; type: "info" | "success" | "error" }>;
  paused: boolean;
  completed: boolean;
  cancelled: boolean;
}

/**
 * Main content script that initializes the extension UI
 */
class SenecaExtension {
  private toolbarContainer: HTMLDivElement | null = null;
  private modalContainer: HTMLDivElement | null = null;
  private uploadHandler: UploadHandler | null = null;
  private modalState: ModalState = {
    visible: false,
    title: "Subiendo calificaciones...",
    current: 0,
    total: 0,
    logs: [],
    paused: false,
    completed: false,
    cancelled: false,
  };

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
      if (!h1 || !h1.textContent?.includes("CUADERNO DE CLASE") || !table) {
        return;
      }
      if (document.getElementById("seneca-extension-toolbar")) {
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
   * Inject Vue components into the page
   */
  private injectUI(table: Element): void {
    const parent = table.parentNode;
    if (!parent) return;

    // Create toolbar container
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.id = "seneca-extension-toolbar";
    parent.insertBefore(this.toolbarContainer, parent.firstChild);

    // Create modal container
    this.modalContainer = document.createElement("div");
    this.modalContainer.id = "seneca-extension-modal";
    document.body.appendChild(this.modalContainer);

    // Mount toolbar
    const toolbarApp = createApp(Toolbar, {
      visible: true,
      onDownload: this.handleDownload.bind(this),
      onUpload: this.handleUpload.bind(this),
    });
    toolbarApp.mount(this.toolbarContainer);

    // Mount modal
    const modalApp = createApp(UploadModal, {
      get visible() {
        return this.modalState.visible;
      },
      get title() {
        return this.modalState.title;
      },
      get current() {
        return this.modalState.current;
      },
      get total() {
        return this.modalState.total;
      },
      get logs() {
        return this.modalState.logs;
      },
      get paused() {
        return this.modalState.paused;
      },
      get completed() {
        return this.modalState.completed;
      },
      get cancelled() {
        return this.modalState.cancelled;
      },
      onClose: this.handleModalClose.bind(this),
      onPause: this.handleModalPause.bind(this),
      onCancel: this.handleModalCancel.bind(this),
      modalState: this.modalState,
    });
    modalApp.mount(this.modalContainer);
  }

  /**
   * Handle download button click
   */
  private handleDownload(): void {
    DownloadHandler.handleDownload();
  }

  /**
   * Handle file upload
   */
  private async handleUpload(file: File): Promise<void> {
    // Reset modal state
    this.modalState.visible = true;
    this.modalState.current = 0;
    this.modalState.total = 0;
    this.modalState.logs = [];
    this.modalState.paused = false;
    this.modalState.completed = false;
    this.modalState.cancelled = false;

    // Create upload handler
    this.uploadHandler = new UploadHandler((progress: UploadProgress) => {
      this.modalState.current = progress.current;
      this.modalState.total = progress.total;
      this.modalState.logs.push({
        message: progress.message,
        type: progress.type,
      });

      if (progress.type === "error" || progress.percentage === 100) {
        this.modalState.completed = true;
      }
    });

    try {
      await this.uploadHandler.processFile(file);
    } catch (error) {
      console.error("Error processing file:", error);
      this.modalState.logs.push({
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
      });
      this.modalState.completed = true;
    }
  }

  /**
   * Handle modal close
   */
  private handleModalClose(): void {
    this.modalState.visible = false;
    this.uploadHandler = null;
  }

  /**
   * Handle modal pause
   */
  private handleModalPause(): void {
    if (this.uploadHandler) {
      this.uploadHandler.pause();
      this.modalState.paused = this.uploadHandler.isPaused();
    }
  }

  /**
   * Handle modal cancel
   */
  private handleModalCancel(): void {
    if (this.uploadHandler) {
      this.uploadHandler.cancel();
      this.modalState.cancelled = true;
    }
  }
}

// Initialize extension when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const extension = new SenecaExtension();
    extension.init();
  });
} else {
  const extension = new SenecaExtension();
  extension.init();
}
