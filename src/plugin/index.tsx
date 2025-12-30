import React from "react";
import ReactDOM from "react-dom/client";
import SocialMedia from "../gallery/socalMediaGallery";
import SingleSocialMedia from "../gallery/SingleSocialMedia";
import { SocialPost } from "../gallery/socalMediaGallery";

// Import styles - these will be bundled into the CSS output
import "../index.css";
import "../App.css";

// Types for plugin options
export interface GalleryOptions {
  type: "gallery" | "single";
  // For single post view
  postId?: number | string;
  post?: SocialPost;
  // For gallery view
  posts?: SocialPost[];
  // Common options
  baseUrl?: string;
  uid?: number | string;
  domain?: string;
  onPostClick?: (post: SocialPost) => void;
  onBackClick?: () => void;
}

// Store roots for cleanup
const roots = new Map<string, ReactDOM.Root>();

/**
 * Initialize the gallery component
 * @param selector - CSS selector for the container element
 * @param options - Configuration options
 */
function initGallery(selector: string, options: GalleryOptions) {
  const el = document.querySelector(selector);
  if (!el) {
    console.error(`[ReactGallery] Element not found: ${selector}`);
    return null;
  }

  // Cleanup existing root if any
  if (roots.has(selector)) {
    roots.get(selector)?.unmount();
    roots.delete(selector);
  }

  const root = ReactDOM.createRoot(el);
  roots.set(selector, root);

  if (options.type === "single") {
      console.log("single", options.uid, options.domain);
    root.render(

      <React.StrictMode>
        <SingleSocialMedia
          postId={options.postId}
          post={options.post}
          baseUrl={options.baseUrl}
          uid={options.uid}
          domain={options.domain}
          onPostClick={options.onPostClick}
          onBackClick={options.onBackClick}
        />
      </React.StrictMode>
    );
  } else {
    console.log("single", options.uid, options.domain);

    root.render(
      <React.StrictMode>
        <SocialMedia
          initialPosts={options.posts}
          baseUrl={options.baseUrl}
          uid={options.uid}
          domain={options.domain}
          onPostClick={options.onPostClick}
        />
      </React.StrictMode>
    );
  }

  return {
    unmount: () => {
      root.unmount();
      roots.delete(selector);
    },
    root,
  };
}

/**
 * Destroy gallery instance
 * @param selector - CSS selector for the container element
 */
function destroyGallery(selector: string) {
  if (roots.has(selector)) {
    roots.get(selector)?.unmount();
    roots.delete(selector);
    return true;
  }
  return false;
}

/**
 * Destroy all gallery instances
 */
function destroyAll() {
  roots.forEach((root) => root.unmount());
  roots.clear();
}

// Create global object for WordPress usage
const ReactGallery = {
  initGallery,
  destroyGallery,
  destroyAll,
  version: "1.0.0",
};

// Expose to window
declare global {
  interface Window {
    ReactGallery: typeof ReactGallery;
  }
}

window.ReactGallery = ReactGallery;

export { initGallery, destroyGallery, destroyAll };
export default ReactGallery;

