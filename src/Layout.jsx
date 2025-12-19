import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Menu, X, ChevronRight, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

const publicPages = [
  { name: "Landing", label: "Home" },
  { name: "OurWhy", label: "Our Why" },
  { name: "ALIVEMethod", label: "ALIVE Method" },
  { name: "Experts", label: "Experts" },
  { name: "Apply", label: "Apply" },
  { name: "Contact", label: "Contact" },
];

const appPages = [
  { name: "Dashboard", label: "Dashboard" },
  { name: "MyPathway", label: "My Pathway" },
  { name: "ModulesLibrary", label: "Modules" },
  { name: "ToolsHub", label: "Tools" },
  { name: "Journal", label: "Journal" },
  { name: "CheckIn", label: "Check-In" },
  { name: "Blueprint", label: "Blueprint" },
  { name: "Progress", label: "Progress" },
];

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isPublicPage = publicPages.some(p => p.name === currentPageName) || currentPageName === "Login";
  const navItems = isPublicPage ? publicPages : appPages;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const userData = await base44.auth.me();
          setUser(userData);
          
          // Redirect authenticated users to onboarding if not completed
          if (!isPublicPage && currentPageName !== "OnboardingDiagnostic" && currentPageName !== "Dashboard") {
            const sessions = await base44.entities.DiagnosticSession.filter(
              { isComplete: true },
              "-created_date",
              1
            );
            
            if (!sessions || sessions.length === 0) {
              // No completed diagnostic, redirect to onboarding
              window.location.href = createPageUrl("OnboardingDiagnostic");
            }
          }
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [currentPageName, isPublicPage]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-pink-50/30">
      <style>{`
        :root {
          --burgundy: #6B1B3D;
          --burgundy-deep: #4A1228;
          --rose-accent: #C67793;
          --rose-accent-2: #C4687D;
          --rose-dark: #8B2E4D;
        }
        
        .text-burgundy { color: var(--burgundy); }
        .bg-burgundy { background-color: var(--burgundy); }
        .border-burgundy { border-color: var(--burgundy); }
        .hover\\:bg-burgundy-deep:hover { background-color: var(--burgundy-deep); }
        .text-rose-accent { color: var(--rose-accent); }
        .bg-rose-accent { background-color: var(--rose-accent); }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>

      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isPublicPage
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={createPageUrl(isAuthenticated && !isPublicPage ? "Dashboard" : "Landing")} className="flex-shrink-0">
              <span className={`text-xl font-bold tracking-tight ${scrolled || !isPublicPage ? "text-burgundy" : "text-white"}`}>
                THE ALIGNED WOMAN
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className={`text-sm font-medium tracking-wide transition-colors ${
                    currentPageName === item.name
                      ? scrolled || !isPublicPage ? "text-burgundy" : "text-white"
                      : scrolled || !isPublicPage
                        ? "text-gray-600 hover:text-burgundy"
                        : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label.toUpperCase()}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`hidden lg:flex items-center gap-2 ${
                        scrolled || !isPublicPage ? "text-burgundy" : "text-white"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-burgundy flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.full_name?.[0] || user?.email?.[0] || "U"}
                        </span>
                      </div>
                      <span className="font-medium">{user?.full_name?.split(" ")[0] || "Account"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Settings")} className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden lg:flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => base44.auth.redirectToLogin()}
                    className={scrolled || !isPublicPage ? "text-burgundy" : "text-white"}
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-burgundy hover:bg-burgundy-deep text-white px-6"
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 ${scrolled || !isPublicPage ? "text-burgundy" : "text-white"}`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t"
            >
              <div className="px-4 py-6 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      currentPageName === item.name
                        ? "bg-pink-50 text-burgundy"
                        : "text-gray-700 hover:bg-pink-50"
                    }`}
                  >
                    {item.label}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
                
                <div className="pt-4 border-t mt-4">
                  {isAuthenticated ? (
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-burgundy text-burgundy"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      onClick={() => base44.auth.redirectToLogin()}
                      className="w-full bg-burgundy hover:bg-burgundy-deep text-white"
                    >
                      Get Started
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page Content */}
      <main className={isPublicPage ? "" : "pt-20"}>
        {children}
      </main>

      {/* Footer - only on public pages */}
      {isPublicPage && (
        <footer className="bg-[#4A1228] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-xl font-bold tracking-tight mb-4">THE ALIGNED WOMAN BLUEPRINT™</h3>
                <p className="text-white/70 max-w-md">
                  Your personal operating system for embodied success. Powered by the ALIVE Method™.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-rose-accent">Navigate</h4>
                <ul className="space-y-2">
                  {publicPages.slice(0, 4).map((item) => (
                    <li key={item.name}>
                      <Link
                        to={createPageUrl(item.name)}
                        className="text-white/70 hover:text-white transition-colors text-sm"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-rose-accent">Connect</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to={createPageUrl("Contact")} className="text-white/70 hover:text-white transition-colors text-sm">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link to={createPageUrl("Apply")} className="text-white/70 hover:text-white transition-colors text-sm">
                      Apply Now
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/50 text-sm">
              © {new Date().getFullYear()} The Aligned Woman Blueprint. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}