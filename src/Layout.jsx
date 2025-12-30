import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Bell, MessageCircle, LogOut, User, Settings, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import NotificationsDropdown from "../components/navigation/NotificationsDropdown";
import MessagesDrawer from "../components/navigation/MessagesDrawer";
import LaurAIChatWidget from "../components/LaurAIChatWidget";

const publicPages = [
{ name: "Home", label: "Home" },
{ name: "AWBlueprint", label: "Aligned Woman Blueprint" },
{ name: "OurWhy", label: "Our Why" },
{ name: "ALIVEMethod", label: "ALIVE Method" },
{ name: "Experts", label: "Experts" },
{ name: "Apply", label: "Join" },
{ name: "Contact", label: "Contact" }];


const appNavigation = [
{ name: "Dashboard", label: "Dashboard" },
{ name: "Community", label: "Community" },
{ name: "Members", label: "Members" },
{ name: "Classroom", label: "Classroom" },
{ name: "ExpertsDirectory", label: "Experts" },
{ name: "ToolsHub", label: "Tools" },
{ name: "MyALIVEJourney", label: "ALIVE Method" },
{ name: "Support", label: "Support" }];


export default function Layout({ children, currentPageName }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicPage = publicPages.some((p) => p.name === currentPageName) || currentPageName === "Login";

  // Redirect ALIVEMethod to Home as default page
  useEffect(() => {
    if (currentPageName === "ALIVEMethod" && window.location.pathname === "/ALIVEMethod") {
      window.location.href = createPageUrl("Home");
    }
  }, [currentPageName]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await base44.entities.SiteSettings.list();
        const settingsData = settings[0] || null;
        setSiteSettings(settingsData);
        
        // Update favicon dynamically
        if (settingsData?.light_favicon) {
          const favicon = document.querySelector("link[rel='icon']") || document.createElement("link");
          favicon.rel = "icon";
          favicon.href = settingsData.light_favicon;
          if (!document.querySelector("link[rel='icon']")) {
            document.head.appendChild(favicon);
          }
        }
      } catch (error) {
        console.error("Failed to load site settings:", error);
        setSiteSettings(null);
      }
    };
    loadSettings();
  }, []);

  // No redirect needed - Home page is served at root

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

  // Public page layout with hamburger menu
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-pink-50/30">
        <style>{`
          :root {
            --burgundy: #3C224F;
            --burgundy-deep: #1F0B2E;
            --tertiary: #4B397F;
            --rose-accent: #C67793;
            --rose-accent-2: #C4687D;
            --rose-dark: #8B2E4D;
          }
          .text-burgundy { color: var(--burgundy); }
          .bg-burgundy { background-color: var(--burgundy); }
        `}</style>

        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to={createPageUrl("Home")}>
              <img
                src={siteSettings?.dark_logo || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695154cb868ee011bb627195/23f49bf5a_AlignedWomanLogoPurple.png"}
                alt="The Aligned Woman"
                className="object-contain w-auto"
                style={{ 
                  height: siteSettings?.logo_size === "small" ? "24px" : 
                         siteSettings?.logo_size === "medium" ? "32px" : 
                         siteSettings?.logo_size === "large" ? "40px" : 
                         siteSettings?.logo_size === "custom" ? `${Math.floor(siteSettings.custom_logo_height * 0.67)}px` : "32px",
                  maxWidth: "180px"
                }}
              />
            </Link>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Menu */}
        {showMobileMenu &&
        <>
            <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowMobileMenu(false)} />

            <div className="fixed top-0 right-0 bottom-0 w-80 bg-white z-50 shadow-2xl">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b">
                      <img
                      src={siteSettings?.dark_logo || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695154cb868ee011bb627195/23f49bf5a_AlignedWomanLogoPurple.png"}
                      alt="AW"
                      className="object-contain w-auto"
                      style={{ 
                        height: siteSettings?.logo_size === "small" ? "24px" : 
                               siteSettings?.logo_size === "medium" ? "32px" : 
                               siteSettings?.logo_size === "large" ? "40px" : 
                               siteSettings?.logo_size === "custom" ? `${Math.floor(siteSettings.custom_logo_height * 0.67)}px` : "32px",
                        maxWidth: "160px"
                      }} />

                  <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors">

                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="flex-1 p-6">
                  {isAuthenticated &&
                <>
                      <Button
                    onClick={() => {
                      setShowMobileMenu(false);
                      window.location.href = createPageUrl("Dashboard");
                    }}
                    className="w-full mb-4 text-white"
                    style={{ backgroundColor: '#7340B9' }}>

                        Go to Dashboard
                      </Button>
                      <div className="h-px bg-gray-200 mb-6" />
                    </>
                }
                  <ul className="space-y-2">
                    {publicPages.map((item) =>
                  <li key={item.name}>
                        <Link
                      to={createPageUrl(item.name)}
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-[#3B224E] rounded-lg transition-colors font-medium">

                          {item.label}
                        </Link>
                      </li>
                  )}
                  </ul>
                </nav>

                <div className="p-6 border-t">
                  {isAuthenticated ?
                <Button
                  onClick={handleLogout}
                  className="w-full text-white"
                  style={{ backgroundColor: '#3B224E' }}>

                      Sign Out
                    </Button> :

                <Button
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
                  className="w-full text-white"
                  style={{ backgroundColor: '#3B224E' }}>

                      Sign In
                    </Button>
                }
                </div>
              </div>
            </div>
          </>
        }

        <main className="pt-20">
          {children}
        </main>

        <footer className="bg-[#3B224E] text-white">
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
                  {publicPages.slice(0, 4).map((item) =>
                  <li key={item.name}>
                      <Link to={createPageUrl(item.name)} className="text-white/70 hover:text-white transition-colors text-sm">
                        {item.label}
                      </Link>
                    </li>
                  )}
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
                </div>);

            }

            // Authenticated app layout with left sidebar
            return (
              <div className="min-h-screen flex">
                <style>{`
                  :root {
                    --burgundy: #3B224E;
                    --burgundy-deep: #1F0B2E;
                  }
                `}</style>

                {/* Left Sidebar */}
                <aside className={`fixed left-0 top-0 bottom-0 bg-[#3C224F] text-white flex flex-col z-50 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          {!sidebarCollapsed && (
            <Link to={createPageUrl("Home")}>
              <img
                src={siteSettings?.light_logo || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695154cb868ee011bb627195/23f49bf5a_AlignedWomanLogoPurple.png"}
                alt="The Aligned Woman"
                className="object-contain w-auto max-w-full"
                style={{ 
                  height: siteSettings?.logo_size === "small" ? "28px" : 
                         siteSettings?.logo_size === "medium" ? "40px" : 
                         siteSettings?.logo_size === "large" ? "56px" : 
                         siteSettings?.logo_size === "custom" ? `${Math.floor(siteSettings.custom_logo_height * 0.83)}px` : "40px"
                }}
              />
            </Link>
          )}
        </div>

        {/* Search */}
        <div className={`px-4 py-4 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
          {!sidebarCollapsed ? (
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          ) : (
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link
                to={createPageUrl("Dashboard")}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                  currentPageName === "Dashboard"
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title={sidebarCollapsed ? "Dashboard" : ""}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {!sidebarCollapsed && <span className="font-medium">Dashboard</span>}
              </Link>
            </li>

            <li>
              <Link
                to={createPageUrl("MyMetrics")}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                  currentPageName === "MyMetrics"
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title={sidebarCollapsed ? "Insights" : ""}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {!sidebarCollapsed && <span className="font-medium">Insights</span>}
              </Link>
            </li>

            <li>
              <Link
                to={createPageUrl("Journal")}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                  currentPageName === "Journal"
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title={sidebarCollapsed ? "Journal" : ""}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {!sidebarCollapsed && <span className="font-medium">Journal</span>}
              </Link>
            </li>

            <li>
              <Link
                to={createPageUrl("Classroom")}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                  currentPageName === "Classroom"
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title={sidebarCollapsed ? "Classroom" : ""}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                {!sidebarCollapsed && <span className="font-medium">Classroom</span>}
              </Link>
            </li>

            <li>
              <Link
                to={createPageUrl("Community")}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                  currentPageName === "Community"
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title={sidebarCollapsed ? "Community" : ""}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {!sidebarCollapsed && <span className="font-medium">Community</span>}
              </Link>
            </li>

            <li>
              <Link
                to={createPageUrl("Members")}
                className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
                  currentPageName === "Members"
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title={sidebarCollapsed ? "Members" : ""}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {!sidebarCollapsed && <span className="font-medium">Members</span>}
              </Link>
            </li>

            {/* Tools Dropdown */}
            <li>
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3 rounded-lg transition-colors ${
                  ["ToolsHub", "CheckIn"].includes(currentPageName)
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                title={sidebarCollapsed ? "Tools" : ""}
              >
                <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  {!sidebarCollapsed && <span className="font-medium">Tools</span>}
                </div>
                {!sidebarCollapsed && (
                  <svg
                    className={`w-4 h-4 transition-transform ${showToolsDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Dropdown Items */}
              {showToolsDropdown && !sidebarCollapsed && (
                <ul className="mt-1 ml-8 space-y-1">
                  <li>
                    <Link
                      to={createPageUrl("Journal")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Reflect
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={createPageUrl("CheckIn")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Regulate
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={createPageUrl("DefineMyPurpose")}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Define My Purpose
                    </Link>
                  </li>
                  <li>
                    <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cycle
                    </button>
                  </li>
                  <li>
                    <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Sleep
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-gray-200" style={{ backgroundColor: '#5B2D83' }}>
          <div className="flex items-center justify-between gap-4 px-8 py-4">
            {/* Greeting */}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return "Good Morning";
                  if (hour < 18) return "Good Afternoon";
                  return "Good Evening";
                })()}, {user?.full_name?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="text-white/80 text-sm">Hope you feel centered today.</p>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Messages */}
              <button
                onClick={() => setShowMessages(!showMessages)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
              </button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden">
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/20 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user?.full_name?.[0] || user?.email?.[0] || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-white max-w-[120px] truncate">
                      {user?.full_name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white" />
                  </button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("ProfileSettings")} className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                {user && ["owner", "admin", "master_admin", "moderator", "expert", "course_creator"].includes(user.role) && (
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
        </header>

        {/* Notifications Dropdown */}
        {showNotifications && <NotificationsDropdown onClose={() => setShowNotifications(false)} />}

        {/* Messages Drawer */}
        {showMessages && <MessagesDrawer onClose={() => setShowMessages(false)} />}

        {/* Main Content */}
        <main>{children}</main>

        {/* LaurAI Chat Widget */}
        <LaurAIChatWidget />
      </div>
    </div>
  );

}