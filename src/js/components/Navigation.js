/**
 * Navigation component for handling mobile menu and active states
 */
export class Navigation {
  constructor() {
    this.navToggle = document.querySelector('.nav-toggle');
    this.navLinks = document.querySelector('.nav-links');
    this.initialized = false;
  }

  /**
   * Initialize navigation functionality
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    this.setupMobileMenu();
    this.setActiveNavItem();
    this.initialized = true;
  }

  /**
   * Setup mobile menu toggle functionality
   */
  setupMobileMenu() {
    if (!this.navToggle || !this.navLinks) {
      return;
    }

    // Mobile menu toggle
    this.navToggle.addEventListener('click', () => {
      this.navLinks.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    this.navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        this.navLinks.classList.remove('active');
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.navToggle.contains(e.target) && !this.navLinks.contains(e.target)) {
        this.navLinks.classList.remove('active');
      }
    });
  }

  /**
   * Set active navigation item based on current page
   */
  setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || 
          (currentPage === '' && href === 'index.html') ||
          (currentPage === 'index.html' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
   * Close mobile menu programmatically
   */
  closeMobileMenu() {
    if (this.navLinks) {
      this.navLinks.classList.remove('active');
    }
  }

  /**
   * Toggle mobile menu programmatically
   */
  toggleMobileMenu() {
    if (this.navLinks) {
      this.navLinks.classList.toggle('active');
    }
  }
}