import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Bell, MessageCircle, Search, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import NotificationsDropdown from "@/components/navigation/NotificationsDropdown.js";
import MessagesDrawer from "@/components/navigation/MessagesDrawer.js";

const publicPages = [
  { name: "Landing", label: "Home" },
  { name: "OurWhy", label: "Our Why" },
  { name: "ALIVEMethod", label: "ALIVE Method" },
  { name: "Experts", label: "Experts" },
  { name: "Apply", label: "Apply" },
  { name: "Contact", label: "Contact" },
];

const appNavigation = [
  { name: "Dashboard", label: "Dashboard" },
  { name: "Community", label: "Community" },
  { name: "Members", label: "Members" },
  { name: "Classroom", label: "Classroom" },
  { name: "Experts", label: "Experts" },
  { name: "ToolsHub", label: "Tools" },
  { name: "ALIVEMethod", label: "ALIVE Method" },
  { name: "Support", label: "Support" },
];

export default function Layout({ children, currentPageName }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const location = useLocation();

  const isPublicPage = publicPages.some(p => p.name === currentPageName) || currentPageName === "Login";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        setIsAuthenticated(authenticated);
        if (authenticated) {
          const userData = await base44.auth.me();
          setUser(userData);
          
          // Redirect to onboarding if not completed
          if (!isPublicPage && currentPageName !== "OnboardingForm") {
            const sessions = await base44.entities.DiagnosticSession.filter(
              { isComplete: true },
              "-created_date",
              1
            );

            if (!sessions || sessions.length === 0) {
              window.location.href = createPageUrl("OnboardingForm");
            }
          }
        }
      } catch (e) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [currentPageName, isPublicPage]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = createPageUrl("SearchResults") + `?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Public page layout (unchanged)
  if (isPublicPage) {
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
        `}</style>

        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <Link to={createPageUrl("Landing")} className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6945438e6f6e0e1d874ba569/fa1001979_AWLogo_.png"
                  alt="The Aligned Woman Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold tracking-tight text-burgundy">
                  THE ALIGNED WOMAN
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                {publicPages.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    className="text-gray-700 hover:text-burgundy transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {!isAuthenticated && (
                <Button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                  className="bg-burgundy hover:bg-burgundy-deep text-white"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="pt-20">
          {children}
        </main>

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
                      <Link to={createPageUrl(item.name)} className="text-white/70 hover:text-white transition-colors text-sm">
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
      </div>
    );
  }

  // Authenticated app layout (Skool-inspired)
  const visibleNavItems = currentPageName === "Dashboard" 
    ? appNavigation.filter(item => item.name !== "Dashboard")
    : appNavigation;

  return (
    <div className="min-h-screen">
      <style>{`
        :root {
          --burgundy: #6B1B3D;
          --burgundy-deep: #4A1228;
        }
      `}</style>

      {/* Global Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto px-6">
          {/* Top Row: Logo, Search, Icons, Profile */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 flex-shrink-0">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6945438e6f6e0e1d874ba569/fa1001979_AWLogo_.png"
                alt="AW"
                className="w-8 h-8"
              />
              <span className="hidden lg:block text-base font-bold text-[#6B1B3D]">
                THE ALIGNED WOMAN
              </span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search community, modules, tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-2">
              {/* Messages */}
              <button
                onClick={() => setShowMessages(!showMessages)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-gray-600" />
                {/* Unread badge would go here */}
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {/* Unread badge would go here */}
              </button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full border-2 border-purple-500 overflow-hidden">
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#6B1B3D] flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {user?.full_name?.[0] || user?.email?.[0] || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("ProfileSettings")} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  {user && ["admin", "master_admin", "moderator", "expert", "course_creator"].includes(user.role) && (
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("AdminSettings")} className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Admin Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-0 border-t border-gray-100">
            {visibleNavItems.map((item) => (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  currentPageName === item.name
                    ? "text-[#6B1B3D] border-[#6B1B3D]"
                    : "text-gray-600 hover:text-[#6B1B3D] border-transparent hover:border-gray-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <NotificationsDropdown onClose={() => setShowNotifications(false)} />
      )}

      {/* Messages Drawer */}
      {showMessages && (
        <MessagesDrawer onClose={() => setShowMessages(false)} />
      )}

      {/* Main Content */}
      <main className="pt-[120px]">
        {children}
      </main>
    </div>
  );
}