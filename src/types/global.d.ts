// Global type definitions for phrase-forge

// Workbox types for PWA support
interface Workbox {
  addEventListener: (event: string, callback: () => void) => void;
  messageSkipWaiting: () => void;
  register: () => void;
}

// Extend Window interface to include workbox
declare global {
  interface Window {
    workbox?: Workbox;
  }
}

// NotificationAction interface for Web Notifications API
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export {};