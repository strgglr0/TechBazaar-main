import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Menu, X, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import ShoppingCartComponent from "@/components/shopping-cart";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { totalItems, setIsOpen } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" data-testid="link-home">
                <h1 className="text-2xl font-bold font-lora transition-colors" style={{ color: '#5B4824' }}>
                  TechMarket
                </h1>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search for phones, laptops, desktops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-input border-border rounded-lg font-geist"
                  data-testid="input-search"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </form>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" data-testid="link-products">
                <Button variant="ghost" className="text-foreground hover:text-primary font-geist font-medium">
                  Products
                </Button>
              </Link>
              
              {!isAuthenticated ? (
                <>
                  <Link href="/signup" data-testid="link-signup">
                    <Button variant="ghost" className="text-foreground hover:text-primary font-geist font-medium">
                      Sign up
                    </Button>
                  </Link>
                  <Link href="/login" data-testid="link-login">
                    <Button variant="ghost" className="text-foreground hover:text-primary font-geist font-medium">
                      Sign in
                    </Button>
                  </Link>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-foreground hover:text-primary font-geist font-medium">
                      <User className="h-4 w-4 mr-2" />
                      {user?.name || 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      {user?.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Cart */}
              <Button
                variant="ghost"
                className="relative p-2 text-foreground hover:text-primary"
                onClick={() => setIsOpen(true)}
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center cart-badge font-geist">
                    {totalItems}
                  </span>
                )}
              </Button>
              
              {/* Admin Link */}
              <Link href="/admin" data-testid="link-admin">
                <Button className="bg-secondary text-secondary-foreground font-geist font-medium hover:bg-secondary/90">
                  Admin
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="relative">
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-mobile"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </form>

                    <div className="flex flex-col space-y-2">
                      <Link href="/" data-testid="link-products-mobile">
                        <Button variant="ghost" className="w-full justify-start font-geist">
                          Products
                        </Button>
                      </Link>
                      
                      <Button
                        variant="ghost"
                        className="w-full justify-start font-geist"
                        onClick={() => setIsOpen(true)}
                        data-testid="button-cart-mobile"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Cart ({totalItems})
                      </Button>
                      
                      <Link href="/admin" data-testid="link-admin-mobile">
                        <Button variant="outline" className="w-full font-geist">
                          Admin Panel
                        </Button>
                      </Link>
                      
                      {!isAuthenticated ? (
                        <>
                          <Link href="/signup" data-testid="link-signup-mobile">
                            <Button variant="ghost" className="w-full justify-start font-geist">
                              Sign up
                            </Button>
                          </Link>
                          <Link href="/login" data-testid="link-login-mobile">
                            <Button variant="ghost" className="w-full justify-start font-geist">
                              Sign in
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Signed in as {user?.name}
                          </div>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start font-geist"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <ShoppingCartComponent />
    </>
  );
}
