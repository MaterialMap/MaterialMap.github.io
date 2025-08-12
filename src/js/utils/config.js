/**
 * Configuration and constants
 */
export const CONFIG = {
  TIMEOUTS: {
    TOML_PARSER: 5000,
    DEPENDENCIES: 10000
  },
  PATHS: {
    DATA: '/data',
    LIB: '/lib',
    DIST: '/dist'
  },
  TABLE: {
    PAGE_LENGTH: 20,
    RESPONSIVE_PRIORITY: {
      MATERIAL: 1,
      APPLICATIONS: 2
    }
  }
};

/**
 * Universal base path calculator
 */
export function getBasePath() {
  const { origin, pathname, port } = window.location;

  // Check if the site is running via file://
  if (origin.startsWith("file://")) {
    const pathParts = pathname.split("/");
    pathParts.pop(); // Remove 'index.html' or the last segment
    return pathParts.join("/");
  }

  // Check if the site is running on localhost with a non-privileged port
  if (origin.includes("localhost") || origin.includes("127.0.0.1") || (port && parseInt(port) > 1024)) {
    return "./";
  }

  // For GitHub Pages
  const repoName = pathname.split("/")[1];
  return repoName ? `/${repoName}` : "/";
}

export const BASE_PATH = getBasePath();