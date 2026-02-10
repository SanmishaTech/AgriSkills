'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function isSafeInternalPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}

async function resolveResumePath(pathname: string): Promise<string> {
  // If user is on a quiz, store the owning course chapters page.
  // Quiz route is /quiz/[chapterId]
  if (pathname.startsWith('/quiz/')) {
    const parts = pathname.split('/').filter(Boolean);
    const chapterId = parts[1];
    if (chapterId) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return pathname;

        const res = await fetch(`/api/quiz/${chapterId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const courseId = data?.quiz?.chapter?.course?.id;
          if (typeof courseId === 'string' && courseId.length > 0) {
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
    await fetch('/api/user/last-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lastUrl }),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export default function LastUrlTracker() {
  const pathname = usePathname();
  const lastResolvedRef = useRef<string>('');
  const inflightResolve = useRef<Promise<string> | null>(null);

  // Keep an up-to-date resolved path in a ref.
  useEffect(() => {
    if (!pathname) return;

    inflightResolve.current = resolveResumePath(pathname);
    inflightResolve.current
      .then((resolved) => {
        lastResolvedRef.current = resolved;
      })
      .catch(() => {
        lastResolvedRef.current = pathname;
      });
  }, [pathname]);

  // On tab close / pagehide, persist the last resolved URL.
  useEffect(() => {
    const handler = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const resolved = lastResolvedRef.current || pathname || '/dashboard';
        persistLastUrl(resolved, token);
      } catch {
        // ignore
      }
    };

    window.addEventListener('pagehide', handler);
    return () => window.removeEventListener('pagehide', handler);
  }, [pathname]);

  return null;
}
