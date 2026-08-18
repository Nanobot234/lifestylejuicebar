import React from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Menu as MenuIcon, X, LogIn, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/logo.webp";
import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { cartItems, total } = useCart();
  const { currentUser, setCurrentUser, isAuthenticated, isBusinessOwner, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/menu", label: "Menu" },
    { path: "/menu?category=juice%20cleanse", label: "Juice Cleanse" },
    { path: "/events", label: "Events" },
    { path: "/track-order", label: "Track Order" },
    { path: "/contact", label: "Contact" },
  ];

  const menuSubLinks = [
    { path: "/menu?category=juice%20cleanse", label: "Juice Cleanse" },
    { path: "/menu?category=superfood%20blends", label: "Superfood Blends" },
    { path: "/menu?category=protein%20blends", label: "Protein Blends" },
    { path: "/menu?category=fresh%20juice", label: "Fresh Juices" },
    { path: "/menu?category=cold-pressed%20juice", label: "Cold-Pressed" },
    { path: "/menu?category=bowls", label: "Bowls" },
    { path: "/menu?category=toast", label: "Toast" },
    { path: "/menu?category=protein%20bites", label: "Protein Bites" },
    { path: "/menu?category=sea%20moss", label: "Sea Moss" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    console.log("layout logout");
    logout();
    localStorage.clear();
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PaymentTestModeBanner />
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center leading-none" aria-label="Lifestyle 1104 Juice Bar">
              <img src={logo} alt="Lifestyle 1104 Juice Bar" className="h-[4.75rem] md:h-[5.5rem] w-auto" />
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-xs tracking-[0.2em] uppercase font-medium transition duration-200 hover:text-foreground ${
                  isActive && location.pathname === "/" ? "text-foreground" : "text-muted-foreground"
                }`
              }
            >
              Home
            </NavLink>

            {/* Juice Menu with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`text-xs tracking-[0.2em] uppercase font-medium transition duration-200 hover:text-foreground flex items-center gap-1 ${
                    location.pathname === "/menu" ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Menu <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => navigate("/menu")}>
                  All Products
                </DropdownMenuItem>
                {menuSubLinks.map((sub) => (
                  <DropdownMenuItem key={sub.path} onClick={() => navigate(sub.path)}>
                    {sub.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink
              to="/menu?category=juice%20cleanse"
              className="text-xs tracking-[0.2em] uppercase font-medium transition duration-200 text-muted-foreground hover:text-foreground"
            >
              Juice Cleanse
            </NavLink>

            <NavLink
              to="/events"
              className={({ isActive }) =>
                `text-xs tracking-[0.2em] uppercase font-medium transition duration-200 hover:text-foreground ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }
            >
              Events
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `text-xs tracking-[0.2em] uppercase font-medium transition duration-200 hover:text-foreground ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }
            >
              Contact
            </NavLink>

            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `text-xs tracking-[0.2em] uppercase font-medium transition duration-200 hover:text-foreground ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }
            >
              Track Order
            </NavLink>
          </nav>

          <div className="flex items-center space-x-2">
            {/* Authentication Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="mr-2">
                    <User className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">
                      {currentUser?.name || "Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isBusinessOwner ? (
                    <DropdownMenuItem onClick={() => navigate("/business-dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate("/my-orders")}>
                      My Orders
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => navigate("/login")}
              >
                <LogIn className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            )}
            
            <NavLink to="/cart" className="relative mr-2">
              <Button variant="ghost" className="rounded-full p-2">
                <ShoppingCart className="h-5 w-5 text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-foreground text-background text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </NavLink>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleMenu}>
                    <MenuIcon className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <div className="flex flex-col h-full py-6">
                    <div className="flex items-center justify-between mb-8">
                      <span className="font-display text-xl text-foreground">LIFESTYLE 1104</span>
                      <Button variant="ghost" size="icon" onClick={toggleMenu}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <nav className="flex flex-col space-y-4">
                      <NavLink
                        to="/"
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                            isActive && location.pathname === "/"
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`
                        }
                      >
                        Home
                      </NavLink>
                      <NavLink
                        to="/menu"
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                            isActive
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`
                        }
                      >
                        Menu
                      </NavLink>
                      <div className="pl-4 flex flex-col space-y-2">
                        {menuSubLinks.map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            onClick={() => setIsMenuOpen(false)}
                            className="px-2 py-1.5 rounded-md tracking-[0.1em] uppercase text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                      <NavLink
                        to="/contact"
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                            isActive
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`
                        }
                      >
                        Contact
                      </NavLink>
                      <Link
                        to="/menu?category=juice%20cleanse"
                        onClick={() => setIsMenuOpen(false)}
                        className="px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Juice Cleanse
                      </Link>
                      <NavLink
                        to="/events"
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                            isActive
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`
                        }
                      >
                        Events
                      </NavLink>
                      <NavLink
                        to="/track-order"
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                            isActive
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`
                        }
                      >
                        Track Order
                      </NavLink>
                      
                      {isAuthenticated ? (
                        <>
                          {isBusinessOwner ? (
                            <NavLink
                              to="/business-dashboard"
                              onClick={() => setIsMenuOpen(false)}
                              className={({ isActive }) =>
                                `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                                  isActive
                                    ? "bg-muted text-foreground font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`
                              }
                            >
                              Dashboard
                            </NavLink>
                          ) : (
                            <NavLink
                              to="/my-orders"
                              onClick={() => setIsMenuOpen(false)}
                              className={({ isActive }) =>
                                `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                                  isActive
                                    ? "bg-muted text-foreground font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`
                              }
                            >
                              My Orders
                            </NavLink>
                          )}
                          <Button
                            variant="ghost"
                            className="justify-start px-2 py-6 h-auto font-normal"
                            onClick={() => {
                              handleLogout();
                              setIsMenuOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
                        </>
                      ) : (
                        <NavLink
                          to="/login"
                          onClick={() => setIsMenuOpen(false)}
                          className={({ isActive }) =>
                            `px-2 py-2 rounded-md tracking-[0.15em] uppercase text-sm ${
                              isActive
                                ? "bg-muted text-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`
                          }
                        >
                          Login
                        </NavLink>
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-foreground text-background py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <span className="text-[10px] tracking-[0.25em] text-background/60">EST. 2023</span>
              <h3 className="font-display text-xl mt-1 mb-3">LIFESTYLE 1104</h3>
              <p className="text-background/70 mb-4 text-sm leading-relaxed">
                Cold-pressed juices and handcrafted smoothies — made fresh, made for the way you live.
              </p>
            </div>
            <div>
              <h3 className="text-xs tracking-[0.25em] uppercase mb-4 text-background/60">Explore</h3>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink 
                      to={item.path} 
                      className="text-background/80 hover:text-background transition-colors text-sm"
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <NavLink 
                    to="/cart" 
                    className="text-background/80 hover:text-background transition-colors text-sm"
                  >
                    Cart
                  </NavLink>
                </li>
                {isAuthenticated && !isBusinessOwner && (
                  <li>
                    <NavLink 
                      to="/my-orders" 
                      className="text-background/80 hover:text-background transition-colors text-sm"
                    >
                      My Orders
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-xs tracking-[0.25em] uppercase mb-4 text-background/60">Visit</h3>
              <ul className="space-y-3 mb-5">
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=6+E+167th+St+Bronx+NY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/80 hover:text-background transition-colors text-sm underline underline-offset-4"
                  >
                    6 E. 167th St. — Bronx, NY
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=411+W+35th+St+New+York+NY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/80 hover:text-background transition-colors text-sm underline underline-offset-4"
                  >
                    411 W. 35th St. — New York, NY
                  </a>
                </li>
              </ul>
              <p className="text-background/80 mb-2 text-sm">Follow us on Instagram</p>
              <a href="https://www.instagram.com/lifestyle1104juicebar" target="_blank" rel="noopener noreferrer" className="text-background underline underline-offset-4 text-sm">@lifestyle1104juicebar</a>
            </div>
          </div>
          <div className="border-t border-background/15 mt-10 pt-6 text-center text-background/50 text-xs tracking-wider">
            <p>© {new Date().getFullYear()} LIFESTYLE 1104 JUICE BAR</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
