/**
 * Footer - Shared Footer Component
 */

class Footer {
    constructor() {
        this.placeholderId = 'footer-placeholder';
    }

    render() {
        const placeholder = document.getElementById(this.placeholderId);
        if (!placeholder) return;

        placeholder.innerHTML = `
<footer class="bg-slate-900 text-white mt-auto">
  <div class="mx-auto max-w-7xl border-b border-slate-800 px-6 py-16">
    <div class="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <h2 class="text-3xl font-extrabold">Join our community</h2>
        <p class="mt-4 text-slate-400 max-w-md">Subscribe to our newsletter for early access to new collections and exclusive discounts.</p>
      </div>
      <div>
        <form class="flex w-full max-w-md flex-col gap-3 sm:flex-row lg:ml-auto" onsubmit="event.preventDefault(); showToast('Subscription successful!', 'success')">
          <input class="h-12 flex-1 rounded-lg border-none bg-slate-800 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-primary" placeholder="Enter your email" type="email" required/>
          <button class="h-12 rounded-lg bg-primary px-8 font-bold hover:bg-primary/90 transition-all" type="submit">Subscribe</button>
        </form>
      </div>
    </div>
  </div>
  <div class="mx-auto max-w-7xl px-6 py-16">
    <div class="grid grid-cols-2 gap-12 md:grid-cols-4">
      <div class="col-span-2 md:col-span-1">
        <div class="flex items-center gap-2 mb-6 cursor-pointer" onclick="router.navigate('index.html')">
          <div class="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
            <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
          </div>
          <span class="text-xl font-bold tracking-tight">ShopEase</span>
        </div>
        <p class="text-sm text-slate-400 leading-relaxed">Redefining modern retail with quality, accessibility, and style.</p>
      </div>
      <div>
        <h4 class="mb-6 text-sm font-bold uppercase tracking-widest text-slate-500">Shop</h4>
        <ul class="flex flex-col gap-4 text-sm text-slate-400">
          <li><a class="hover:text-primary transition-colors cursor-pointer" onclick="router.navigate('products.html')">All Products</a></li>
          <li><a class="hover:text-primary transition-colors cursor-pointer">New Arrivals</a></li>
          <li><a class="hover:text-primary transition-colors cursor-pointer">Sale</a></li>
        </ul>
      </div>
      <div>
        <h4 class="mb-6 text-sm font-bold uppercase tracking-widest text-slate-500">Account</h4>
        <ul class="flex flex-col gap-4 text-sm text-slate-400">
          <li><a class="hover:text-primary transition-colors cursor-pointer" onclick="router.navigate('login.html')">Login</a></li>
          <li><a class="hover:text-primary transition-colors cursor-pointer" onclick="router.navigate('register.html')">Register</a></li>
          <li><a class="hover:text-primary transition-colors cursor-pointer" onclick="router.navigate('profile.html')">My Profile</a></li>
          <li><a class="hover:text-primary transition-colors cursor-pointer" onclick="router.navigate('cart.html')">My Cart</a></li>
        </ul>
      </div>
      <div>
        <h4 class="mb-6 text-sm font-bold uppercase tracking-widest text-slate-500">Legal</h4>
        <ul class="flex flex-col gap-4 text-sm text-slate-400">
          <li><a class="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
          <li><a class="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div class="mt-16 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
      <p class="text-xs text-slate-500">© 2024 ShopEase Inc. All rights reserved.</p>
    </div>
  </div>
</footer>
        `;
    }
}

const footer = new Footer();
document.addEventListener('DOMContentLoaded', () => footer.render());
