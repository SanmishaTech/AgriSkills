"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home, User as UserIcon, LogOut, X } from "lucide-react";

function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

async function resolveResumePath(pathname: string): Promise<string> {
  if (pathname.startsWith("/quiz/")) {
    const parts = pathname.split("/").filter(Boolean);
    const chapterId = parts[1];
    if (chapterId) {
      try {
        const token = localStorage.getItem("token");
        if (!token) return pathname;

        const res = await fetch(`/api/quiz/${chapterId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const courseId = data?.quiz?.chapter?.course?.id;
          if (typeof courseId === "string" && courseId.length > 0) {
            return `/course/${courseId}/chapters`;
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return pathname;
}

async function persistLastUrl(lastUrl: string, token: string) {
  if (!isSafeInternalPath(lastUrl)) return;
  try {
    await fetch("/api/user/last-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lastUrl }),
    });
  } catch {
    // ignore
  }
}

function getPageHelp(pathname: string): { title: string; description: string } {
  // Normalize trailing slash
  const p = pathname.replace(/\/$/, '') || '/';

  // Dashboard pages
  if (p === '/dashboard/user') return {
    title: 'Your Dashboard',
    description: 'This is your personal dashboard. Here you can see your enrolled courses, track your learning progress, and access your certificates. Use the cards to navigate to courses and topics.'
  };
  if (p === '/dashboard' || p === '/dashboard/admin') return {
    title: 'Admin Dashboard',
    description: 'This is the admin control panel. Manage courses, topics, quizzes, users, and support tickets from here. Use the sidebar or menu to navigate between admin tools.'
  };
  if (p.startsWith('/dashboard/admin/topics') && p.includes('/demo')) return {
    title: 'Topic Demo Management',
    description: 'Manage demo videos and content for this topic. Add, edit or remove demo materials that students can preview before enrolling.'
  };
  if (p.startsWith('/dashboard/admin/topics') && p.includes('/questions')) return {
    title: 'Topic Questions Management',
    description: 'Manage discussion questions for this topic. Add, edit or delete questions that students will use for group discussions.'
  };
  if (p.match(/^\/dashboard\/admin\/topics\/[^/]+$/)) return {
    title: 'Edit Topic',
    description: 'Edit the details of this topic including its name, description, icon, and associated content. Save your changes when done.'
  };
  if (p === '/dashboard/admin/topics') return {
    title: 'Topics Management',
    description: 'View and manage all topics in the system. Create new topics, edit existing ones, or manage their content, demos and questions.'
  };
  if (p.match(/^\/dashboard\/admin\/courses\/[^/]+\/chapters$/)) return {
    title: 'Course Chapters',
    description: 'Manage the chapters for this course. Add new chapters, reorder them, or edit existing chapter content and quizzes.'
  };
  if (p === '/dashboard/admin/courses/add') return {
    title: 'Add New Course',
    description: 'Create a new course by filling in the course details — name, description, category, and other settings.'
  };
  if (p === '/dashboard/admin/courses/preview') return {
    title: 'Course Preview',
    description: 'Preview how this course will appear to students before publishing it.'
  };
  if (p.startsWith('/dashboard/admin/chapters') && p.includes('/quiz')) return {
    title: 'Chapter Quiz',
    description: 'Manage the quiz for this chapter. Add or edit questions, set correct answers, and configure quiz settings.'
  };
  if (p === '/dashboard/admin/chapters/preview') return {
    title: 'Chapter Preview',
    description: 'Preview the chapter content as students will see it, including text, media, and interactive elements.'
  };
  if (p === '/dashboard/admin/quizzes') return {
    title: 'Quizzes Management',
    description: 'View and manage all quizzes. Create new quizzes, edit questions, and review quiz performance.'
  };
  if (p === '/dashboard/admin/quizzes/add') return {
    title: 'Add New Quiz',
    description: 'Create a new quiz by setting its details and adding questions with answer options.'
  };
  if (p.match(/^\/dashboard\/admin\/quizzes\/[^/]+\/edit$/)) return {
    title: 'Edit Quiz',
    description: 'Edit this quiz — modify questions, update answers, and adjust quiz settings.'
  };
  if (p.match(/^\/dashboard\/admin\/quizzes\/[^/]+$/)) return {
    title: 'Quiz Details',
    description: 'View the details and questions of this quiz. You can edit or delete it from here.'
  };
  if (p === '/dashboard/admin/shorts') return {
    title: 'Shorts Management',
    description: 'Manage short video content. Add new short videos, edit titles, or remove existing ones.'
  };
  if (p === '/dashboard/admin/support-tickets') return {
    title: 'Support Tickets',
    description: 'View and respond to user support tickets. Track open, pending, and resolved issues.'
  };
  if (p.match(/^\/dashboard\/admin\/users\/[^/]+$/)) return {
    title: 'User Details',
    description: 'View detailed information about this user including their profile, courses, and activity.'
  };

  // Student-facing pages
  if (p.match(/^\/topic\/[^/]+\/subtopics\/[^/]+$/)) return {
    title: 'Subtopic',
    description: 'You are viewing a subtopic. Read through the content, watch any videos, and explore the learning materials provided.'
  };
  if (p.match(/^\/topic\/[^/]+\/subtopics$/)) return {
    title: 'Subtopics',
    description: 'Browse all the subtopics under this topic. Click on any subtopic to view its detailed content and learning materials.'
  };
  if (p.match(/^\/topic\/[^/]+\/questions$/)) return {
    title: 'Topic Questions',
    description: 'These are discussion questions for this topic. Mark the questions you have discussed in your group and save your progress.'
  };
  if (p.match(/^\/topic\/[^/]+$/)) return {
    title: 'Topic Details',
    description: 'Explore this topic — view its description, subtopics, demo videos, and discussion questions. Navigate to specific sections using the tabs.'
  };

  // Course & Learning
  if (p.match(/^\/course\/[^/]+\/chapters$/)) return {
    title: 'Course Chapters',
    description: 'View all chapters in this course. Complete them in order to earn your certificate. Each chapter has learning content and a quiz.'
  };
  if (p === '/learn') return {
    title: 'Learn',
    description: 'Browse all available courses and continue your learning journey. Pick up where you left off or start something new.'
  };
  if (p.match(/^\/learn\/chapter\/[^/]+$/)) return {
    title: 'Chapter Content',
    description: 'Read through the chapter content carefully. Once done, take the chapter quiz to test your understanding.'
  };
  if (p.match(/^\/learn\/[^/]+$/) || p.match(/^\/learn-free\/[^/]+$/)) return {
    title: 'Lesson',
    description: 'You are viewing a lesson. Go through the content at your own pace and take the quiz when ready.'
  };

  // Quiz
  if (p.match(/^\/quiz\/[^/]+\/results$/)) return {
    title: 'Quiz Results',
    description: 'View your quiz results. See which questions you got right or wrong, and review the correct answers.'
  };
  if (p.match(/^\/quiz\/[^/]+$/) || p.match(/^\/quiz-free\/[^/]+$/)) return {
    title: 'Quiz',
    description: 'Answer each question carefully. Select the best answer and move to the next question. Your score will be shown at the end.'
  };

  // Other pages
  if (p === '/profile') return {
    title: 'Your Profile',
    description: 'View and update your profile information including your name, phone number, and profile photo.'
  };
  if (p === '/certificates') return {
    title: 'Certificates',
    description: 'View and download your earned certificates. Complete all chapters in a course to earn its certificate.'
  };
  if (p === '/success-stories') return {
    title: 'Success Stories',
    description: 'Read inspiring success stories from farmers who have benefited from modern agricultural techniques and this platform.'
  };
  if (p === '/help') return {
    title: 'Help & Support',
    description: 'Find answers to common questions, submit a support ticket, or get in touch with our team for assistance.'
  };

  // Default
  return {
    title: 'Page Help',
    description: 'Welcome to this page. Use the navigation buttons to explore. Click the back arrow to go to the previous page, or the home icon to return to the homepage.'
  };
}

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
  const [showHelp, setShowHelp] = useState(false);
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

  // Close help dialog on route change
  useEffect(() => {
    setShowHelp(false);
  }, [pathname]);

  const handleBack = () => {
    if (!user) {
      router.push('/');
      return;
    }

    if (pathname?.startsWith('/topic/')) {
      router.push(user ? '/dashboard/user' : '/');
      return;
    }

    router.back();
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token && pathname) {
        const resumePath = await resolveResumePath(pathname);
        await persistLastUrl(resumePath, token);
      }
    } finally {
      // Only clear authentication data, preserve user-specific data for when they log back in
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setMenuOpen(false);
      router.push("/login");
    }
  };

  // Render only after mount to prevent hydration mismatch
  if (shouldHide || !mounted) return null;

  const pageHelp = getPageHelp(pathname || '/');

  if (!user) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 border-b border-amber-200 bg-amber-100">
          <div className="mx-auto max-w-5xl px-4 py-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Back"
                onClick={handleBack}
                className="w-8 h-8 rounded-full border-2 border-gray-500 text-gray-700 flex items-center justify-center active:scale-[0.97] transition"
              >
                <ArrowLeft className="w-[14px] h-[14px]" />
              </button>

              <div className="flex items-center gap-3">
                {/* Help */}
                <button
                  type="button"
                  aria-label="Help"
                  onClick={() => setShowHelp(true)}
                  className="w-8 h-8 rounded-full bg-black flex items-center justify-center active:scale-[0.97] transition hover:bg-gray-800"
                >
                  <span className="text-amber-50 text-[18px] font-bold leading-none">?</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-11" />

        {/* Help Dialog for non-logged-in users */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowHelp(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
                    <span className="text-amber-50 text-lg font-bold">?</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{pageHelp.title}</h3>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="px-5 py-4">
                <p className="text-gray-700 text-sm leading-relaxed">{pageHelp.description}</p>
              </div>
              <div className="px-5 pb-4">
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all active:scale-[0.98]"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

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
              onClick={handleBack}
              className="w-8 h-8 rounded-full border-2 border-gray-500 text-gray-700 flex items-center justify-center active:scale-[0.97] transition"
            >
              <ArrowLeft className="w-[14px] h-[14px]" />
            </button>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Help */}
              <button
                type="button"
                aria-label="Help"
                onClick={() => setShowHelp(true)}
                className="w-8 h-8 rounded-full bg-black flex items-center justify-center active:scale-[0.97] transition hover:bg-gray-800"
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

      <div className="h-11" />

      {/* Help Dialog */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
                  <span className="text-amber-50 text-lg font-bold">?</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{pageHelp.title}</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-gray-700 text-sm leading-relaxed">{pageHelp.description}</p>
            </div>
            <div className="px-5 pb-4">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all active:scale-[0.98]"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
