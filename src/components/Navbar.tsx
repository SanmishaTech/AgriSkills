"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home, User as UserIcon, LogOut } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  profilePhoto?: string;
}

export default function Navbar() {
  // Avoid reading localStorage during initial render to keep SSR/CSR markup identical
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Hide on auth pages, the home route, and preview pages
  const hideOnPages = ["/", "/login", "/register"];
  const isPreviewPage = pathname?.includes('/preview');
  const shouldHide = hideOnPages.includes(pathname) || isPreviewPage;

  useEffect(() => {
    setMounted(true);
    try {
      const token = localStorage.getItem("token");
      const data = localStorage.getItem("user");
      if (token && data) {
        setUser(JSON.parse(data));
      } else {
        // Clean up stale user if token is missing
        if (!token) localStorage.removeItem("user");
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, [pathname]);

  // Keep user state in sync across tabs/windows
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "token" || e.key === "user") {
        try {
          const token = localStorage.getItem("token");
          const data = localStorage.getItem("user");
          if (token && data) {
            setUser(JSON.parse(data));
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Reset image error state if the profile photo URL changes
  useEffect(() => {
    setImgError(false);
  }, [user?.profilePhoto]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    // Only clear authentication data, preserve user-specific data for when they log back in
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMenuOpen(false);
    router.push("/login");
  };

  // Render only after mount to prevent hydration mismatch; and only for logged-in users
  if (shouldHide || !mounted || !user) return null;

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  const hasPhoto = !!(
    user.profilePhoto &&
    typeof user.profilePhoto === "string" &&
    user.profilePhoto.trim().length > 0
  );

  const displayName = user.name || user.email || "User";
  const displayPhone = user.phone || "";

  return (
    <>
      {/* Fixed top navbar */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-amber-200 bg-amber-100">
        <div className="mx-auto max-w-5xl px-4 py-1">
          <div className="flex items-center justify-between">
            {/* Back button (circular) */}
            <button
              type="button"
              aria-label="Back"
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full border-2 border-gray-500 text-gray-700 flex items-center justify-center active:scale-[0.97] transition"
            >
              <ArrowLeft className="w-[14px] h-[14px]" />
            </button>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Help (?) */}
              <button
                type="button"
                aria-label="Help"
                className="w-8 h-8 rounded-full bg-black flex items-center justify-center active:scale-[0.97] transition"
              >
                <span className="text-amber-50 text-[18px] font-bold leading-none">?</span>
              </button>

              {/* Home */}
              <button
                type="button"
                aria-label="Home"
                onClick={() => router.push("/")}
                className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-700 active:scale-[0.97] transition"
              >
                <Home className="w-[16px] h-[16px]" />
              </button>

              {/* Profile menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-label="Profile"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-700 font-semibold"
                  title={user.name || user.email}
                >
                  {hasPhoto && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePhoto}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-xs">{initial}</span>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                    <div className="absolute -top-2 right-3 h-0 w-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-gray-200" />
                    <div className="absolute -top-[7px] right-3 h-0 w-0 border-l-7 border-l-transparent border-r-7 border-r-transparent border-b-7 border-b-white" />

                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">
                        {displayName}
                      </div>
                      {displayPhone ? (
                        <div className="text-xs text-gray-600 leading-tight">{displayPhone}</div>
                      ) : null}
                    </div>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent overlap */}
      <div className="h-11" />
    </>
  );
}
