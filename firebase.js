// Firebase Configuration and Utilities
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOCVaPPPF0J1GRnrPV-cy3KGdDvBJmdKY",
    authDomain: "l-amour-jewelry.firebaseapp.com",
    projectId: "l-amour-jewelry",
    storageBucket: "l-amour-jewelry.firebasestorage.app",
    messagingSenderId: "781244207566",
    appId: "1:781244207566:web:73c2840a5368afa6701b9f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log('User signed in:', user.email);
        updateAuthUI(true, user);
    } else {
        // User is signed out
        console.log('User signed out');
        updateAuthUI(false);
    }
});

// Update auth UI based on user state
function updateAuthUI(isSignedIn, user = null) {
    const authBtnNav = document.getElementById('auth-btn-nav');
    const authSection = document.getElementById('auth');
    
    if (authBtnNav) {
        if (isSignedIn) {
            authBtnNav.innerHTML = `
                <i class="fas fa-user"></i>
                <span>${user?.displayName || user?.email || 'Account'}</span>
            `;
            authBtnNav.onclick = () => signOutUser();
        } else {
            authBtnNav.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Login</span>
            `;
            authBtnNav.onclick = () => showAuthSection();
        }
    }
}

// Show auth section
function showAuthSection() {
    const authSection = document.getElementById('auth');
    if (authSection) {
        authSection.style.display = 'block';
        scrollToSection('#auth');
    }
}

// Hide auth section
function hideAuthSection() {
    const authSection = document.getElementById('auth');
    if (authSection) {
        authSection.style.display = 'none';
    }
}

// Google Sign In
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google sign in successful:', result.user);
        hideAuthSection();
        showToast('Successfully signed in with Google!', 'success');
    } catch (error) {
        console.error('Google sign in error:', error);
        showToast('Failed to sign in with Google', 'error');
    }
}

// Facebook Sign In
async function signInWithFacebook() {
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        console.log('Facebook sign in successful:', result.user);
        hideAuthSection();
        showToast('Successfully signed in with Facebook!', 'success');
    } catch (error) {
        console.error('Facebook sign in error:', error);
        showToast('Failed to sign in with Facebook', 'error');
    }
}

// Email/Password Sign Up
async function signUpWithEmail(email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Email sign up successful:', result.user);
        hideAuthSection();
        showToast('Account created successfully!', 'success');
    } catch (error) {
        console.error('Email sign up error:', error);
        showToast(error.message, 'error');
    }
}

// Email/Password Sign In
async function signInWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('Email sign in successful:', result.user);
        hideAuthSection();
        showToast('Successfully signed in!', 'success');
    } catch (error) {
        console.error('Email sign in error:', error);
        showToast(error.message, 'error');
    }
}

// Sign Out
async function signOutUser() {
    try {
        await signOut(auth);
        showToast('Successfully signed out!', 'info');
    } catch (error) {
        console.error('Sign out error:', error);
        showToast('Failed to sign out', 'error');
    }
}

// Toggle between login and signup
function toggleAuthMode() {
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authSubmit = document.getElementById('auth-submit');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchLink = document.getElementById('auth-switch-link');
    const authForm = document.getElementById('auth-form');
    
    const isLoginMode = authTitle.textContent === 'Welcome Back';
    
    if (isLoginMode) {
        // Switch to signup
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Sign up to start shopping with us';
        authSubmit.textContent = 'Sign Up';
        authSwitchText.textContent = 'Already have an account?';
        authSwitchLink.textContent = 'Sign in';
        
        // Add name field for signup
        if (!document.getElementById('auth-name')) {
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.id = 'auth-name';
            nameInput.placeholder = 'Full name';
            nameInput.required = true;
            authForm.insertBefore(nameInput, authForm.firstChild);
        }
    } else {
        // Switch to login
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to your account to continue shopping';
        authSubmit.textContent = 'Sign In';
        authSwitchText.textContent = 'Don\'t have an account?';
        authSwitchLink.textContent = 'Sign up';
        
        // Remove name field for login
        const nameInput = document.getElementById('auth-name');
        if (nameInput) {
            nameInput.remove();
        }
    }
}

// Handle auth form submission
function handleAuthFormSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const nameInput = document.getElementById('auth-name');
    
    const isLoginMode = document.getElementById('auth-title').textContent === 'Welcome Back';
    
    if (isLoginMode) {
        signInWithEmail(email, password);
    } else {
        if (nameInput) {
            const name = nameInput.value;
            signUpWithEmail(email, password);
        } else {
            signUpWithEmail(email, password);
        }
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Smooth scroll function
function scrollToSection(selector) {
    const target = document.querySelector(selector);
    if (target) {
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Google sign in button
    const googleSigninBtn = document.getElementById('google-signin');
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', signInWithGoogle);
    }
    
    // Facebook sign in button
    const facebookSigninBtn = document.getElementById('facebook-signin');
    if (facebookSigninBtn) {
        facebookSigninBtn.addEventListener('click', signInWithFacebook);
    }
    
    // Auth form submission
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthFormSubmit);
    }
    
    // Auth mode toggle
    const authSwitchLink = document.getElementById('auth-switch-link');
    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }
    
    // Close auth section when clicking outside
    document.addEventListener('click', (e) => {
        const authSection = document.getElementById('auth');
        const authContainer = document.querySelector('.auth-container');
        
        if (authSection && authSection.style.display === 'block' && 
            !authContainer.contains(e.target) && 
            !e.target.closest('#auth-btn-nav')) {
            hideAuthSection();
        }
    });
});

// Export functions for use in other scripts
window.firebaseAuth = {
    signInWithGoogle,
    signInWithFacebook,
    signUpWithEmail,
    signInWithEmail,
    signOutUser,
    showAuthSection,
    hideAuthSection,
    toggleAuthMode
};

// Global functions for other scripts to use
export { 
    signInWithGoogle, 
    signInWithFacebook, 
    signUpWithEmail, 
    signInWithEmail, 
    signOutUser, 
    toggleAuthMode, 
    handleAuthFormSubmit,
    showToast,
    scrollToSection
};

// Firebase Service Class
export class FirebaseService {
    constructor() {
        this.db = null;
        this.storage = null;
        this.init();
    }

    async init() {
        try {
            // Wait for Firebase to be available
            while (!window.firebaseDB || !window.firebaseStorage) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.db = window.firebaseDB;
            this.storage = window.firebaseStorage;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
        }
    }

    // Get products from Firestore
    async getProducts(category = null, limit = null) {
        try {
            const { collection, getDocs, query, where, limit: limitQuery } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            let q = collection(this.db, 'products');
            
            if (category) {
                q = query(q, where('category', '==', category));
            }
            
            if (limit) {
                q = query(q, limitQuery(limit));
            }
            
            const querySnapshot = await getDocs(q);
            const products = [];
            
            querySnapshot.forEach((doc) => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            // Return mock data if Firebase fails
            return this.getMockProducts(category, limit);
        }
    }

    // Submit contact form to Firestore
    async submitContact(formData) {
        try {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const docRef = await addDoc(collection(this.db, 'contacts'), {
                name: formData.name,
                email: formData.email,
                message: formData.message,
                timestamp: new Date()
            });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error submitting contact form:', error);
            return { success: false, error: error.message };
        }
    }

    // Get mock products for fallback
    getMockProducts(category = null, limit = null) {
        const allProducts = [
            {
                id: '1',
                title: 'Diamond Eternity Ring',
                imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                description: 'A stunning eternity ring featuring brilliant-cut diamonds set in 18k white gold.',
                price: 2500,
                category: 'rings',
                featured: true
            },
            {
                id: '2',
                title: 'Pearl Drop Necklace',
                imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                description: 'Elegant pearl drop necklace crafted in 14k gold with South Sea pearls.',
                price: 850,
                category: 'necklaces',
                featured: true
            },
            {
                id: '3',
                title: 'Sapphire Stud Earrings',
                imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                description: 'Classic sapphire stud earrings set in platinum with Ceylon sapphires.',
                price: 1200,
                category: 'earrings',
                featured: true
            },
            {
                id: '4',
                title: 'Gold Bangle Set',
                imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                description: 'Traditional 22k gold bangle set with intricate designs.',
                price: 1800,
                category: 'bracelets',
                featured: true
            },
            {
                id: '5',
                title: 'Emerald Cut Ring',
                imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                description: 'Stunning emerald cut ring with exceptional clarity and brilliance.',
                price: 3200,
                category: 'rings',
                featured: false
            },
            {
                id: '6',
                title: 'Diamond Pendant',
                imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                description: 'Elegant diamond pendant necklace perfect for any occasion.',
                price: 1800,
                category: 'necklaces',
                featured: false
            },
            {
                id: '7',
                title: 'Rose Gold Hoop Earrings',
                imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
                description: 'Modern rose gold hoop earrings with a contemporary design.',
                price: 650,
                category: 'earrings',
                featured: false
            },
            {
                id: '8',
                title: 'Silver Chain Bracelet',
                imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
                description: 'Delicate silver chain bracelet with adjustable clasp.',
                price: 450,
                category: 'bracelets',
                featured: false
            }
        ];

        let filteredProducts = allProducts;

        if (category) {
            filteredProducts = allProducts.filter(product => product.category === category);
        }

        if (limit) {
            filteredProducts = filteredProducts.slice(0, limit);
        }

        return filteredProducts;
    }

    // Get featured products
    async getFeaturedProducts(limit = 4) {
        const products = await this.getProducts(null, limit);
        return products.filter(product => product.featured).slice(0, limit);
    }

    // Get product by ID
    async getProductById(id) {
        const products = await this.getProducts();
        return products.find(product => product.id === id);
    }
}

// Initialize Firebase service
const firebaseService = new FirebaseService();

// Export for global access
window.firebaseService = firebaseService;

export async function saveCheckoutDetails(details) {
    const docRef = await addDoc(collection(db, 'checkouts'), details);
    return docRef.id;
} 