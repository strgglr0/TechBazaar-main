import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-muted border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3 font-geist" style={{ color: 'hsl(39.27, 43.31%, 24.9%)' }}>
              HMN Tech Store
            </h3>
            <p className="text-sm text-muted-foreground font-geist">
              Your trusted source for the latest technology products.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-sm mb-3 font-geist">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-muted-foreground hover:text-primary transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-sm mb-3 font-geist">Support</h3>
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">Need assistance?</p>
              <a 
                href="mailto:ryannoche116@gmail.com" 
                className="text-primary hover:underline block"
              >
                ryannoche116@gmail.com
              </a>
              <p className="text-xs text-muted-foreground">
                For account issues and general support
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} HMN Tech Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
