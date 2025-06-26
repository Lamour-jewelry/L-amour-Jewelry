// L'amour Jewelry - Main JavaScript
// import { FirebaseService, showToast, scrollToSection } from './firebase.js';

console.log('Script.js loaded successfully');

class LamourJewelry {
    constructor() {
        this.cart = [];
        this.isMobileMenuOpen = false;
        this.isModalOpen = false;
        this.wishlist = [];
        this.user = null;
        this.authDropdowns = [];
        
        this.init();
    }

    init() {
        console.log('Initializing LamourJewelry...');
        this.setTheme('dark');
        this.loadCart();
        this.setupEventListeners();
        this.loadFeaturedProducts();
        this.setupScrollEffects();
        this.hideLoadingScreen();
        this.setupAuthStateListener();
        console.log('LamourJewelry initialization complete');
    }

    setupAuthStateListener() {
        // Check if Firebase Auth is available
        if (!window.firebaseAuth) {
            console.warn('Firebase Auth not available, using fallback auth state');
            return;
        }

        // Listen for auth state changes
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                this.user = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email,
                    provider: user.providerData[0]?.providerId || 'email'
                };
            } else {
                this.user = null;
            }
            this.updateAuthUI();
        }, (error) => {
            console.error('Auth state listener error:', error);
        });
    }

    // Theme Management
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }

    // Theme Management
    toggleTheme() {
        // Theme toggle removed - dark mode only
    }

    // Cart Management
    loadCart() {
        const savedCart = localStorage.getItem('lamour_cart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
        }
        this.updateCartCount();
    }

    saveCart() {
        localStorage.setItem('lamour_cart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.showToast(`${product.title} added to cart!`, 'success');
        this.createConfetti();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.showToast('Item removed from cart', 'info');
    }

    updateCartQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = count;
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Authentication Methods
    async signInWithGoogle() {
        try {
            // Check if Firebase Auth is available
            if (!window.firebaseAuth || !window.firebaseAuthMethods) {
                throw new Error('Firebase Authentication not initialized');
            }

            // Show loading state
            const loadingAlert = Swal.fire({
                title: 'Sign in with Google',
                text: 'Opening Google sign-in...',
                icon: 'info',
                showConfirmButton: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Use Firebase Auth
            const authResult = await window.firebaseAuthMethods.signInWithPopup(
                window.firebaseAuth, 
                window.googleProvider
            );
            
            // Close loading alert
            loadingAlert.close();
            
            this.user = {
                uid: authResult.user.uid,
                email: authResult.user.email,
                displayName: authResult.user.displayName || 'Google User',
                provider: 'google'
            };
            
            this.updateAuthUI();
            this.closeAllDropdowns();
            
            Swal.fire({
                title: 'Welcome to L\'amour!',
                text: `Hello ${this.user.displayName}! You have been successfully signed in.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Google sign in error:', error);
            
            // Handle specific Firebase errors
            if (error.code === 'auth/popup-closed-by-user') {
                Swal.fire({
                    title: 'Sign-in Cancelled',
                    text: 'You cancelled the Google sign-in',
                    icon: 'info'
                });
            } else if (error.code === 'auth/popup-blocked') {
                Swal.fire({
                    title: 'Pop-up Blocked',
                    text: 'Please allow pop-ups for this site and try again',
                    icon: 'warning'
                });
            } else if (error.code === 'auth/unauthorized-domain') {
                Swal.fire({
                    title: 'Domain Not Authorized',
                    text: 'This domain needs to be added to Firebase authentication settings.',
                    icon: 'error'
                });
            } else {
                Swal.fire({
                    title: 'Sign-in Error',
                    text: error.message || 'There was an issue with Google sign-in',
                    icon: 'error'
                });
            }
        }
    }

    async signUpWithEmail() {
        const { value: formValues } = await Swal.fire({
            title: 'Create Your Account',
            html: `
                <div style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-dark);">Full Name</label>
                    <input id="swal-input1" class="swal2-input" placeholder="Enter your full name" required>
                </div>
                <div style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-dark);">Email Address</label>
                    <input id="swal-input2" class="swal2-input" type="email" placeholder="Enter your email address" required>
                </div>
                <div style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-dark);">Password</label>
                    <input id="swal-input3" class="swal2-input" type="password" placeholder="Create a password (min 6 characters)" required>
                </div>
                <div style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-dark);">Confirm Password</label>
                    <input id="swal-input4" class="swal2-input" type="password" placeholder="Confirm your password" required>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Create Account',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d4af37',
            cancelButtonColor: '#6c757d',
            preConfirm: () => {
                const name = document.getElementById('swal-input1').value.trim();
                const email = document.getElementById('swal-input2').value.trim();
                const password = document.getElementById('swal-input3').value;
                const confirmPassword = document.getElementById('swal-input4').value;
                
                if (!name || !email || !password || !confirmPassword) {
                    Swal.showValidationMessage('Please fill in all fields');
                    return false;
                }
                
                if (name.length < 2) {
                    Swal.showValidationMessage('Name must be at least 2 characters long');
                    return false;
                }
                
                if (!this.validateEmail(email)) {
                    Swal.showValidationMessage('Please enter a valid email address');
                    return false;
                }
                
                if (password.length < 6) {
                    Swal.showValidationMessage('Password must be at least 6 characters long');
                    return false;
                }
                
                if (password !== confirmPassword) {
                    Swal.showValidationMessage('Passwords do not match');
                    return false;
                }
                
                return { name, email, password };
            }
        });

        if (formValues) {
            try {
                // Show loading state
                Swal.fire({
                    title: 'Creating Account...',
                    text: 'Please wait while we set up your account',
                    icon: 'info',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Use Firebase Auth to create account
                const authResult = await window.firebaseAuthMethods.createUserWithEmailAndPassword(
                    window.firebaseAuth,
                    formValues.email,
                    formValues.password
                );
                
                this.user = {
                    uid: authResult.user.uid,
                    email: authResult.user.email,
                    displayName: formValues.name,
                    provider: 'email'
                };
                
                this.updateAuthUI();
                this.closeAllDropdowns();
                
                Swal.fire({
                    title: 'Welcome to L\'amour!',
                    text: `Hello ${this.user.displayName}! Your account has been created successfully.`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Email sign up error:', error);
                
                let errorMessage = 'Failed to create account';
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'An account with this email already exists. Please try logging in instead.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Please enter a valid email address.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                Swal.fire({
                    title: 'Account Creation Failed',
                    text: errorMessage,
                    icon: 'error'
                });
            }
        }
    }

    async signInWithEmail() {
        const { value: formValues } = await Swal.fire({
            title: 'Welcome Back',
            html: `
                <div style="text-align: left; margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-dark);">Email Address</label>
                    <input id="swal-input1" class="swal2-input" type="email" placeholder="Enter your email address" required>
                </div>
                <div style="text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-dark);">Password</label>
                    <input id="swal-input2" class="swal2-input" type="password" placeholder="Enter your password" required>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Sign In',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d4af37',
            cancelButtonColor: '#6c757d',
            preConfirm: () => {
                const email = document.getElementById('swal-input1').value.trim();
                const password = document.getElementById('swal-input2').value;
                
                if (!email || !password) {
                    Swal.showValidationMessage('Please fill in all fields');
                    return false;
                }
                
                if (!this.validateEmail(email)) {
                    Swal.showValidationMessage('Please enter a valid email address');
                    return false;
                }
                
                return { email, password };
            }
        });

        if (formValues) {
            try {
                // Show loading state
                Swal.fire({
                    title: 'Signing In...',
                    text: 'Please wait while we verify your credentials',
                    icon: 'info',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Use Firebase Auth to sign in
                const authResult = await window.firebaseAuthMethods.signInWithEmailAndPassword(
                    window.firebaseAuth,
                    formValues.email,
                    formValues.password
                );
                
                this.user = {
                    uid: authResult.user.uid,
                    email: authResult.user.email,
                    displayName: authResult.user.displayName || formValues.email.split('@')[0],
                    provider: 'email'
                };
                
                this.updateAuthUI();
                this.closeAllDropdowns();
                
                Swal.fire({
                    title: 'Welcome to L\'amour!',
                    text: `Hello ${this.user.displayName}! You have been successfully signed in.`,
                    icon: 'success',
                    timer: 3000,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error('Email sign in error:', error);
                
                let errorMessage = 'Failed to sign in';
                if (error.code === 'auth/user-not-found') {
                    errorMessage = 'No account found with this email. Please check your email or create a new account.';
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = 'Incorrect password. Please try again.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = 'Please enter a valid email address.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many failed attempts. Please try again later.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                Swal.fire({
                    title: 'Sign In Failed',
                    text: errorMessage,
                    icon: 'error'
                });
            }
        }
    }

    async signOut() {
        try {
            const userName = this.user?.displayName || 'User';
            
            if (window.firebaseAuth && window.firebaseAuthMethods) {
                await window.firebaseAuthMethods.signOut(window.firebaseAuth);
            }
            
            this.user = null;
            this.updateAuthUI();
            
            Swal.fire({
                title: 'Successfully Logged Out',
                text: `Goodbye, ${userName}! You have been logged out successfully.`,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Sign out error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to sign out',
                icon: 'error'
            });
        }
    }

    updateAuthUI() {
        const googleBtn = document.getElementById('google-auth-btn');
        const signupBtn = document.getElementById('signup-btn');
        const loginBtn = document.getElementById('login-btn');
        
        if (this.user) {
            // User is signed in - show welcome message and logout
            if (googleBtn) {
                googleBtn.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    <span>Welcome, ${this.user.displayName}</span>
                `;
                googleBtn.onclick = () => this.toggleUserDropdown();
                googleBtn.classList.add('user-welcome');
            }
            
            if (signupBtn) {
                signupBtn.style.display = 'none';
            }
            
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                `;
                loginBtn.onclick = () => this.signOut();
                loginBtn.classList.add('logout-btn');
            }
        } else {
            // User is signed out - show all auth buttons
            if (googleBtn) {
                googleBtn.innerHTML = `
                    <i class="fab fa-google"></i>
                    <span>Continue with Google</span>
                `;
                googleBtn.onclick = () => this.signInWithGoogle();
                googleBtn.classList.remove('user-welcome');
            }
            
            if (signupBtn) {
                signupBtn.style.display = 'flex';
                signupBtn.innerHTML = `
                    <i class="fas fa-user-plus"></i>
                    <span>Sign Up</span>
                `;
                signupBtn.onclick = () => this.signUpWithEmail();
            }
            
            if (loginBtn) {
                loginBtn.innerHTML = `
                    <i class="fas fa-sign-in-alt"></i>
                    <span>Login</span>
                `;
                loginBtn.onclick = () => this.signInWithEmail();
                loginBtn.classList.remove('logout-btn');
            }
        }
    }

    toggleUserDropdown() {
        // Show user profile options
        Swal.fire({
            title: 'My Account',
            html: `
                <div style="text-align: left;">
                    <p><strong>Name:</strong> ${this.user.displayName}</p>
                    <p><strong>Email:</strong> ${this.user.email}</p>
                    <p><strong>Provider:</strong> ${this.user.provider}</p>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Sign Out',
            cancelButtonText: 'Close',
            confirmButtonColor: '#dc3545'
        }).then((result) => {
            if (result.isConfirmed) {
                this.signOut();
            }
        });
    }

    closeAllDropdowns() {
        // No dropdowns to close anymore
    }

    showProfile() {
        Swal.fire({
            title: 'My Profile',
            text: 'Profile functionality coming soon!',
            icon: 'info'
        });
        this.closeAllDropdowns();
    }

    showOrders() {
        Swal.fire({
            title: 'My Orders',
            text: 'Order history coming soon!',
            icon: 'info'
        });
        this.closeAllDropdowns();
    }

    // Event Listeners
    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const target = link.getAttribute('href');
                if (target && target.startsWith('#')) {
                    e.preventDefault();
                    this.scrollToSection(target);
                    this.updateActiveNavLink(link);
                }
                // Otherwise, let the browser handle navigation
            });
        });

        // Cart functionality
        const cartIcon = document.getElementById('cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCart();
            });
        }

        const cartClose = document.getElementById('cart-close');
        if (cartClose) {
            cartClose.addEventListener('click', () => this.closeCart());
        }

        const cartOverlay = document.getElementById('cart-overlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCart());
        }

        // Category cards
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                this.filterProducts(category);
                this.scrollToSection('#shop');
            });
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }

        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value;
                this.searchProducts(query);
            });
        }

        // Filter functionality
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.handleFilterChange());
        }

        const priceFilter = document.getElementById('price-filter');
        if (priceFilter) {
            priceFilter.addEventListener('change', () => this.handleFilterChange());
        }

        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.handleFilterChange());
        }

        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreProducts());
        }

        // Modal functionality
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.closeModal());
        }

        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Newsletter form
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
        }

        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

        // Scroll to top button
        const scrollToTopBtn = document.getElementById('scroll-to-top');
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // FAQ functionality
        this.setupFAQAccordion();

        // Setup auth event listeners
        this.setupAuthEventListeners();

        // Global event listeners
        document.addEventListener('click', (e) => {
            // Close dropdowns when clicking outside
            if (!e.target.closest('.auth-buttons')) {
                this.closeAllDropdowns();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeCart();
                this.closeAllDropdowns();
            }
        });

        console.log('Event listeners setup complete');
    }

    // FAQ Accordion Functionality
    setupFAQAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', () => {
                    // Close other FAQ items
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                        }
                    });
                    
                    // Toggle current item
                    item.classList.toggle('active');
                });
            }
        });
    }

    // Mobile Menu
    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        if (this.isMobileMenuOpen) {
            navMenu.classList.add('active');
            mobileMenuToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Product Loading
    async loadFeaturedProducts() {
        try {
            console.log('Loading featured products...');
            // Enhanced product database with 25+ products
            const products = [
                // Rings Collection
                {
                    id: 'ring-1',
                    title: 'Diamond Solitaire Ring',
                    price: 2500,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'rings',
                    description: 'A stunning 1-carat diamond solitaire ring set in 18k white gold.',
                    featured: true,
                    tags: ['diamond', 'solitaire', 'engagement']
                },
                {
                    id: 'ring-2',
                    title: 'Rose Gold Infinity Ring',
                    price: 850,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'rings',
                    description: 'Elegant infinity symbol ring in 14k rose gold.',
                    featured: true,
                    tags: ['rose gold', 'infinity', 'romantic']
                },
                {
                    id: 'ring-3',
                    title: 'Sapphire Halo Ring',
                    price: 1800,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'rings',
                    description: 'Beautiful sapphire center stone surrounded by diamonds.',
                    featured: false,
                    tags: ['sapphire', 'halo', 'blue']
                },
                {
                    id: 'ring-4',
                    title: 'Vintage Art Deco Ring',
                    price: 3200,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'rings',
                    description: 'Stunning vintage-inspired ring with geometric patterns.',
                    featured: true,
                    tags: ['vintage', 'art deco', 'unique']
                },
                {
                    id: 'ring-5',
                    title: 'Emerald Cut Diamond Ring',
                    price: 4200,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'rings',
                    description: 'Sophisticated emerald cut diamond in platinum setting.',
                    featured: false,
                    tags: ['emerald cut', 'diamond', 'platinum']
                },
                {
                    id: 'ring-6',
                    title: 'Pearl and Diamond Ring',
                    price: 1200,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'rings',
                    description: 'Delicate freshwater pearl with diamond accents.',
                    featured: false,
                    tags: ['pearl', 'diamond', 'delicate']
                },

                // Necklaces Collection
                {
                    id: 'necklace-1',
                    title: 'Pearl Strand Necklace',
                    price: 800,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Classic freshwater pearl strand necklace.',
                    featured: true,
                    tags: ['pearl', 'classic', 'elegant']
                },
                {
                    id: 'necklace-2',
                    title: 'Diamond Pendant Necklace',
                    price: 1500,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Stunning diamond pendant on 18k gold chain.',
                    featured: true,
                    tags: ['diamond', 'pendant', 'gold']
                },
                {
                    id: 'necklace-3',
                    title: 'Layered Gold Necklace',
                    price: 650,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Trendy layered necklace in 14k gold.',
                    featured: false,
                    tags: ['layered', 'gold', 'trendy']
                },
                {
                    id: 'necklace-4',
                    title: 'Sapphire Choker',
                    price: 2200,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Elegant sapphire choker with diamond accents.',
                    featured: false,
                    tags: ['sapphire', 'choker', 'elegant']
                },
                {
                    id: 'necklace-5',
                    title: 'Rose Gold Heart Pendant',
                    price: 450,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Sweet heart pendant in rose gold.',
                    featured: false,
                    tags: ['heart', 'rose gold', 'romantic']
                },
                {
                    id: 'necklace-6',
                    title: 'Emerald Statement Necklace',
                    price: 2800,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Bold emerald statement necklace.',
                    featured: false,
                    tags: ['emerald', 'statement', 'bold']
                },
                {
                    id: 'necklace-7',
                    title: 'Minimalist Bar Necklace',
                    price: 320,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Clean and minimal bar necklace.',
                    featured: false,
                    tags: ['minimalist', 'bar', 'clean']
                },

                // Earrings Collection
                {
                    id: 'earrings-1',
                    title: 'Gold Hoop Earrings',
                    price: 450,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'earrings',
                    description: 'Classic 14k gold hoop earrings.',
                    featured: true,
                    tags: ['hoops', 'gold', 'classic']
                },
                {
                    id: 'earrings-2',
                    title: 'Diamond Stud Earrings',
                    price: 1800,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'earrings',
                    description: 'Timeless diamond studs in white gold.',
                    featured: true,
                    tags: ['diamond', 'studs', 'timeless']
                },
                {
                    id: 'earrings-3',
                    title: 'Pearl Drop Earrings',
                    price: 680,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'earrings',
                    description: 'Elegant pearl drop earrings with gold accents.',
                    featured: false,
                    tags: ['pearl', 'drop', 'elegant']
                },
                {
                    id: 'earrings-4',
                    title: 'Chandelier Earrings',
                    price: 950,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'earrings',
                    description: 'Dramatic chandelier earrings for special occasions.',
                    featured: false,
                    tags: ['chandelier', 'dramatic', 'special']
                },
                {
                    id: 'earrings-5',
                    title: 'Rose Gold Huggie Hoops',
                    price: 380,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'earrings',
                    description: 'Trendy huggie hoops in rose gold.',
                    featured: false,
                    tags: ['huggie', 'rose gold', 'trendy']
                },
                {
                    id: 'earrings-6',
                    title: 'Sapphire Cluster Earrings',
                    price: 1200,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'earrings',
                    description: 'Beautiful sapphire cluster earrings.',
                    featured: false,
                    tags: ['sapphire', 'cluster', 'blue']
                },

                // Bracelets Collection
                {
                    id: 'bracelet-1',
                    title: 'Tennis Bracelet',
                    price: 1800,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Dazzling tennis bracelet with round-cut diamonds.',
                    featured: true,
                    tags: ['tennis', 'diamond', 'dazzling']
                },
                {
                    id: 'bracelet-2',
                    title: 'Charm Bracelet',
                    price: 750,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Personalized charm bracelet with meaningful symbols.',
                    featured: false,
                    tags: ['charm', 'personalized', 'meaningful']
                },
                {
                    id: 'bracelet-3',
                    title: 'Bangle Stack',
                    price: 420,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Set of three gold bangles for stacking.',
                    featured: false,
                    tags: ['bangle', 'stack', 'gold']
                },
                {
                    id: 'bracelet-4',
                    title: 'Pearl Bracelet',
                    price: 580,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Elegant pearl bracelet with gold clasp.',
                    featured: false,
                    tags: ['pearl', 'elegant', 'gold']
                },
                {
                    id: 'bracelet-5',
                    title: 'Cuff Bracelet',
                    price: 890,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Bold cuff bracelet with geometric design.',
                    featured: false,
                    tags: ['cuff', 'bold', 'geometric']
                },
                {
                    id: 'bracelet-6',
                    title: 'Chain Link Bracelet',
                    price: 320,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Minimalist chain link bracelet.',
                    featured: false,
                    tags: ['chain', 'minimalist', 'simple']
                },
                {
                    id: 'bracelet-7',
                    title: 'Gemstone Bracelet',
                    price: 650,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Colorful gemstone bracelet with mixed stones.',
                    featured: false,
                    tags: ['gemstone', 'colorful', 'mixed']
                },

                // Additional Premium Pieces
                {
                    id: 'premium-1',
                    title: 'Diamond Eternity Ring',
                    price: 5500,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'rings',
                    description: 'Luxurious diamond eternity ring in platinum.',
                    featured: true,
                    tags: ['diamond', 'eternity', 'luxury']
                },
                {
                    id: 'premium-2',
                    title: 'Ruby and Diamond Necklace',
                    price: 3800,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'necklaces',
                    description: 'Stunning ruby pendant with diamond halo.',
                    featured: true,
                    tags: ['ruby', 'diamond', 'halo']
                },
                {
                    id: 'premium-3',
                    title: 'Emerald Earrings',
                    price: 2200,
                    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                    category: 'earrings',
                    description: 'Sophisticated emerald drop earrings.',
                    featured: false,
                    tags: ['emerald', 'drop', 'sophisticated']
                },
                {
                    id: 'premium-4',
                    title: 'Diamond Tennis Bracelet',
                    price: 4200,
                    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                    category: 'bracelets',
                    description: 'Premium diamond tennis bracelet in white gold.',
                    featured: true,
                    tags: ['diamond', 'tennis', 'premium']
                }
            ];
            
            this.products = products;
            this.renderProducts(products.filter(p => p.featured), 'featured-products');
            this.renderProducts(products, 'shop-products');
            
        } catch (error) {
            console.error('Error loading featured products:', error);
            this.showToast('Error loading products', 'error');
        }
    }

    renderProducts(products, containerId) {
        console.log(`Rendering ${products.length} products in container: ${containerId}`);
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }

        const productsHTML = products.map(product => this.createProductCard(product)).join('');
        container.innerHTML = productsHTML;
        console.log(`Rendered products in ${containerId}`);
        
        // Update product count after rendering
        if (containerId === 'shop-products') {
            this.updateProductCount();
        }
    }

    createProductCard(product) {
        const tags = product.tags ? product.tags.join(', ') : '';
        const isFeatured = product.featured;
        const isNew = Math.random() > 0.7; // Randomly mark some as new
        const isSale = Math.random() > 0.8; // Randomly mark some as sale
        
        return `
            <div class="product-card" data-product-id="${product.id}" data-category="${product.category}" data-price="${product.price}" data-tags="${tags}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                    <div class="product-badges">
                        ${isFeatured ? '<span class="badge featured">Featured</span>' : ''}
                        ${isNew ? '<span class="badge new">New</span>' : ''}
                        ${isSale ? '<span class="badge sale">Sale</span>' : ''}
                    </div>
                    <div class="product-overlay">
                        <button class="quick-view-btn" onclick="lamour.showProductModal('${product.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="wishlist-btn" onclick="lamour.toggleWishlist('${product.id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                    <h3 class="product-title">${product.title}</h3>
                    <div class="product-price">
                        ${isSale ? `<span class="original-price">$${(product.price * 1.2).toLocaleString()}</span>` : ''}
                        <span class="current-price">$${product.price.toLocaleString()}</span>
                    </div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-tags">
                        ${product.tags ? product.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                    </div>
                    <div class="product-actions">
                        <button class="add-to-cart" data-product-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                            Add to Cart
                        </button>
                        <button class="view-details" data-product-id="${product.id}">
                            <i class="fas fa-info-circle"></i>
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async addToCartFromId(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                this.addToCart(product);
            }
        } catch (error) {
            console.error('Error adding product to cart:', error);
        }
    }

    // Modal Management
    async showProductModal(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (!product) return;

            const modal = document.getElementById('product-modal');
            const modalBody = document.getElementById('modal-body');
            
            const isInWishlist = this.wishlist.includes(productId);
            
            modalBody.innerHTML = `
                <div class="product-modal-content">
                    <div class="product-modal-image">
                        <img src="${product.image}" alt="${product.title}">
                        <div class="product-modal-badges">
                            ${product.featured ? '<span class="badge featured">Featured</span>' : ''}
                        </div>
                    </div>
                    <div class="product-modal-details">
                        <div class="product-modal-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                        <h2>${product.title}</h2>
                        <div class="product-modal-price">$${product.price.toLocaleString()}</div>
                        <p class="product-modal-description">${product.description}</p>
                        
                        <div class="product-modal-tags">
                            ${product.tags ? product.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                        </div>
                        
                        <div class="product-modal-actions">
                            <button class="btn btn-primary" onclick="lamour.addToCartFromId('${productId}')">
                                <i class="fas fa-shopping-cart"></i>
                                Add to Cart
                            </button>
                            <button class="btn btn-outline" onclick="lamour.toggleWishlist('${productId}')">
                                <i class="fas fa-heart ${isInWishlist ? 'filled' : ''}"></i>
                                ${isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                            </button>
                        </div>
                        
                        <div class="product-modal-info">
                            <div class="info-item">
                                <i class="fas fa-gem"></i>
                                <span>Certified Gemstones</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-shipping-fast"></i>
                                <span>Free Shipping</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-undo"></i>
                                <span>30-Day Returns</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            modal.classList.add('show');
            this.isModalOpen = true;
            document.body.style.overflow = 'hidden';

            // Add event listener for modal add to cart
            const addToCartBtn = modalBody.querySelector('.add-to-cart-modal');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    this.addToCart(product);
                    this.closeModal();
                });
            }
        } catch (error) {
            console.error('Error showing product modal:', error);
        }
    }

    closeModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.remove('show');
            this.isModalOpen = false;
            document.body.style.overflow = '';
        }
    }

    // Newsletter
    handleNewsletterSubmit(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        if (this.validateEmail(email)) {
            this.showToast('Thank you for subscribing!', 'success');
            e.target.reset();
        } else {
            this.showToast('Please enter a valid email address.', 'error');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Contact form
    handleContactSubmit(e) {
        e.preventDefault();
        this.showToast('Message sent successfully!', 'success');
        e.target.reset();
    }

    // Checkout
    handleCheckout() {
        if (this.cart.length === 0) {
            this.showToast('Your cart is empty!', 'error');
            return;
        }
        this.showToast('Redirecting to checkout...', 'info');
        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 1000);
    }

    // Scroll Effects
    setupScrollEffects() {
        // Scroll to top button
        const scrollToTop = document.getElementById('scroll-to-top');
        if (scrollToTop) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    scrollToTop.classList.add('visible');
                } else {
                    scrollToTop.classList.remove('visible');
                }
            });
        }

        // Navbar scroll effect
        const navbar = document.getElementById('navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.product-card, .category-card, .section-header, .about-content').forEach(el => {
            observer.observe(el);
        });
    }

    // Loading Screen
    hideLoadingScreen() {
        // Hide loading screen immediately and with fallback
        const hideScreen = () => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        };

        // Try to hide immediately
        hideScreen();
        
        // Also hide after a delay as backup
        setTimeout(hideScreen, 1500);
        
        // Final fallback - hide after 3 seconds no matter what
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
                loadingScreen.classList.add('hidden');
            }
        }, 3000);
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Confetti Animation
    createConfetti() {
        const colors = ['#D4AF37', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFE66D'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    // Smooth Scrolling
    scrollToSection(selector) {
        const target = document.querySelector(selector);
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavLink(clickedLink) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        // Add active class to clicked link
        clickedLink.classList.add('active');
    }

    // Product Filtering
    filterProducts(category) {
        const products = document.querySelectorAll('.product-card');
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const sortFilter = document.getElementById('sort-filter');
        
        // Update category filter if provided
        if (category && categoryFilter) {
            categoryFilter.value = category;
        }
        
        // Get filter values
        const selectedCategory = categoryFilter ? categoryFilter.value : category || '';
        const selectedPrice = priceFilter ? priceFilter.value : '';
        const selectedSort = sortFilter ? sortFilter.value : 'featured';
        
        // Filter products
        products.forEach(product => {
            const productCategory = product.dataset.category;
            const productPrice = parseInt(product.dataset.price);
            let showProduct = true;
            
            // Category filter
            if (selectedCategory && productCategory !== selectedCategory) {
                showProduct = false;
            }
            
            // Price filter
            if (selectedPrice && showProduct) {
                const [min, max] = selectedPrice.split('-').map(p => p === '+' ? Infinity : parseInt(p));
                if (productPrice < min || (max !== Infinity && productPrice > max)) {
                    showProduct = false;
                }
            }
            
            product.style.display = showProduct ? 'block' : 'none';
        });
        
        // Sort products
        this.sortProducts(selectedSort);
        
        // Update product count
        this.updateProductCount();
    }

    // Sort products
    sortProducts(sortType) {
        const container = document.getElementById('shop-products');
        if (!container) return;
        
        const products = Array.from(container.children);
        
        products.sort((a, b) => {
            const priceA = parseInt(a.dataset.price);
            const priceB = parseInt(b.dataset.price);
            const titleA = a.querySelector('.product-title').textContent;
            const titleB = b.querySelector('.product-title').textContent;
            
            switch (sortType) {
                case 'price-low':
                    return priceA - priceB;
                case 'price-high':
                    return priceB - priceA;
                case 'name':
                    return titleA.localeCompare(titleB);
                case 'featured':
                default:
                    const featuredA = a.querySelector('.badge.new') ? 1 : 0;
                    const featuredB = b.querySelector('.badge.new') ? 1 : 0;
                    return featuredB - featuredA;
            }
        });
        
        // Re-append sorted products
        products.forEach(product => container.appendChild(product));
    }

    // Update product count
    updateProductCount() {
        const visibleProducts = document.querySelectorAll('.product-card[style*="block"], .product-card:not([style*="none"])');
        const countElement = document.getElementById('product-count');
        if (countElement) {
            countElement.textContent = `${visibleProducts.length} products`;
        }
    }

    // Search products
    searchProducts(query) {
        const products = document.querySelectorAll('.product-card');
        const searchTerm = query.toLowerCase();
        
        products.forEach(product => {
            const title = product.querySelector('.product-title').textContent.toLowerCase();
            const description = product.querySelector('.product-description').textContent.toLowerCase();
            const tags = product.dataset.tags ? product.dataset.tags.toLowerCase() : '';
            
            const matches = title.includes(searchTerm) || 
                           description.includes(searchTerm) || 
                           tags.includes(searchTerm);
            
            product.style.display = matches ? 'block' : 'none';
        });
        
        this.updateProductCount();
    }

    // Cart Toggle
    toggleCart() {
        const cartSection = document.getElementById('cart');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSection && cartOverlay) {
            if (cartSection.classList.contains('active')) {
                this.closeCart();
            } else {
                this.openCart();
            }
        }
    }

    openCart() {
        const cartSection = document.getElementById('cart');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSection && cartOverlay) {
            cartSection.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.updateCartDisplay();
        }
    }

    closeCart() {
        const cartSection = document.getElementById('cart');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSection && cartOverlay) {
            cartSection.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartSubtotal = document.getElementById('cart-subtotal');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems) return;
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (cartSubtotal) cartSubtotal.textContent = '$0.00';
            if (cartTotal) cartTotal.textContent = '$0.00';
            return;
        }
        
        let subtotal = 0;
        cartItems.innerHTML = this.cart.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="cart-item-details">
                        <h4>${item.title}</h4>
                        <p>$${item.price.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button onclick="lamour.updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="lamour.updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="lamour.removeFromCart('${item.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        if (cartSubtotal) cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (cartTotal) cartTotal.textContent = `$${subtotal.toFixed(2)}`;
    }

    // Wishlist functionality
    toggleWishlist(productId) {
        const index = this.wishlist.indexOf(productId);
        if (index > -1) {
            this.wishlist.splice(index, 1);
            this.showToast('Removed from wishlist', 'info');
        } else {
            this.wishlist.push(productId);
            this.showToast('Added to wishlist', 'success');
        }
        localStorage.setItem('lamour_wishlist', JSON.stringify(this.wishlist));
    }

    // Clear all filters
    clearFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const priceFilter = document.getElementById('price-filter');
        const sortFilter = document.getElementById('sort-filter');
        const searchInput = document.getElementById('search-input');
        
        if (categoryFilter) categoryFilter.value = '';
        if (priceFilter) priceFilter.value = '';
        if (sortFilter) sortFilter.value = 'featured';
        if (searchInput) searchInput.value = '';
        
        this.filterProducts();
        this.showToast('Filters cleared', 'info');
    }

    // Handle filter changes
    handleFilterChange() {
        this.filterProducts();
    }

    // Open modal
    openModal() {
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Setup Auth Event Listeners
    setupAuthEventListeners() {
        // Signup button
        const signupBtn = document.getElementById('signup-btn');
        if (signupBtn) {
            signupBtn.addEventListener('click', () => this.signUpWithEmail());
        }

        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.signInWithEmail());
        }

        // Product interactions (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart') || e.target.closest('.add-to-cart')) {
                e.preventDefault();
                const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
                const productId = button.dataset.productId;
                if (productId) {
                    this.addToCartFromId(productId);
                }
            }

            if (e.target.classList.contains('view-details') || e.target.closest('.view-details')) {
                e.preventDefault();
                const button = e.target.classList.contains('view-details') ? e.target : e.target.closest('.view-details');
                const productId = button.dataset.productId;
                if (productId) {
                    this.showProductModal(productId);
                }
            }
        });

        // Footer category links
        const footerCategoryLinks = document.querySelectorAll('[data-category]');
        footerCategoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.dataset.category;
                this.filterProducts(category);
                this.scrollToSection('#shop');
            });
        });

        // Initialize auth UI
        this.updateAuthUI();
    }

    // Load More Products
    loadMoreProducts() {
        // This would typically load more products from a database
        // For now, we'll just show a toast message
        this.showToast('Loading more products...', 'info');
        
        // Simulate loading delay
        setTimeout(() => {
            this.showToast('More products loaded!', 'success');
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating LamourJewelry instance...');
    window.lamour = new LamourJewelry();
    console.log('LamourJewelry instance created and assigned to window.lamour');

    // Mobile dropdown menu logic
    const mobileDropdownToggle = document.getElementById('mobile-dropdown-toggle');
    const mobileDropdownMenu = document.getElementById('mobile-dropdown-menu');
    const mobileMenuLinks = document.querySelectorAll('.mobile-dropdown-menu .nav-link');
    const mobileSignupBtn = document.getElementById('mobile-signup-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const loginBtn = document.getElementById('login-btn');

    function closeMobileDropdown() {
        if (mobileDropdownMenu) mobileDropdownMenu.classList.remove('active');
    }
    function openMobileDropdown() {
        if (mobileDropdownMenu) mobileDropdownMenu.classList.add('active');
    }
    function toggleMobileDropdown() {
        if (mobileDropdownMenu) mobileDropdownMenu.classList.toggle('active');
    }

    if (mobileDropdownToggle) {
        mobileDropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileDropdown();
        });
    }
    // Close dropdown when clicking a link or auth button
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMobileDropdown);
    });
    if (mobileSignupBtn && signupBtn) {
        mobileSignupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeMobileDropdown();
            signupBtn.click();
        });
    }
    if (mobileLoginBtn && loginBtn) {
        mobileLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeMobileDropdown();
            loginBtn.click();
        });
    }
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && mobileDropdownMenu && mobileDropdownMenu.classList.contains('active')) {
            if (!mobileDropdownMenu.contains(e.target) && e.target !== mobileDropdownToggle) {
                closeMobileDropdown();
            }
        }
    });
    // Optional: close on resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) closeMobileDropdown();
    });
});

// Add CSS for confetti animation
const confettiStyles = `
    .confetti {
        position: fixed;
        width: 10px;
        height: 10px;
        pointer-events: none;
        animation: confetti-fall 3s linear forwards;
        z-index: 10000;
    }

    @keyframes confetti-fall {
        0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }

    .product-modal-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .product-modal-image img {
        width: 100%;
        height: 400px;
        object-fit: cover;
        border-radius: var(--border-radius);
    }

    .product-modal-details h2 {
        font-family: var(--font-heading);
        font-size: 2rem;
        margin-bottom: 1rem;
        color: var(--text-dark);
    }

    .product-modal-price {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-gold);
        margin-bottom: 1rem;
    }

    .product-modal-description {
        color: var(--text-light);
        line-height: 1.6;
        margin-bottom: 2rem;
    }

    .product-modal-actions {
        display: flex;
        gap: 1rem;
    }

    @media (max-width: 768px) {
        .product-modal-content {
            grid-template-columns: 1fr;
        }
        
        .product-modal-actions {
            flex-direction: column;
        }
    }
`;

// Inject confetti styles
const styleSheet = document.createElement('style');
styleSheet.textContent = confettiStyles;
document.head.appendChild(styleSheet); 