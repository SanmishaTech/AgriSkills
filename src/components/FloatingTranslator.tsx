'use client';

import { useState, useEffect } from 'react';
import { Globe, RotateCcw, X } from 'lucide-react';

const languageList = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇮🇳' },
    { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
];

const setGoogTransCookie = (langCode: string) => {
    if (typeof document === 'undefined') return;
    const value = `/en/${langCode}`;
    document.cookie = `googtrans=${value};path=/;max-age=31536000`;
};

export default function FloatingTranslator() {
    const [showTranslate, setShowTranslate] = useState(false);
    const [isTranslated, setIsTranslated] = useState(false);
    const [translatedLangName, setTranslatedLangName] = useState('');
    const [showFloatingMenu, setShowFloatingMenu] = useState(false);

    const clearGoogTransCookies = () => {
        if (typeof document === 'undefined') return;
        // Google Translate sets cookies on multiple paths and domains
        const hostname = window.location.hostname;
        const domainParts = hostname.split('.');
        const domains = [
            '',                                           // current domain (no Domain attr)
            hostname,                                     // exact hostname
            '.' + hostname,                               // .hostname
        ];
        // Also try the root domain (e.g. .example.com from sub.example.com)
        if (domainParts.length >= 2) {
            const rootDomain = '.' + domainParts.slice(-2).join('.');
            domains.push(rootDomain);
        }
        for (const domain of domains) {
            const domainStr = domain ? `;domain=${domain}` : '';
            document.cookie = `googtrans=;path=/${domainStr};max-age=0;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
    };

    const changeLanguage = (langCode: string, langName?: string) => {
        setShowTranslate(false);
        setShowFloatingMenu(false);
        if (typeof window === 'undefined') return;

        if (langCode === 'en') {
            setIsTranslated(false);
            setTranslatedLangName('');
            localStorage.removeItem('googleTranslateLang');
            clearGoogTransCookies();

            // Tell Google Translate to revert via the combo selector
            const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
            if (select) {
                select.value = 'en';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
            // Force a reload to fully clean Google Translate state
            window.location.reload();
            return;
        }

        setIsTranslated(true);
        setTranslatedLangName(langName || langCode);
        localStorage.setItem('googleTranslateLang', langCode);
        setGoogTransCookie(langCode);

        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return;
        }

        window.location.reload();
    };

    const showOriginal = () => {
        changeLanguage('en', 'English');
    };

    // Listen for custom event from header language button
    useEffect(() => {
        const handler = () => setShowTranslate(true);
        window.addEventListener('open-language-picker', handler);
        return () => window.removeEventListener('open-language-picker', handler);
    }, []);

    // Initialize Google Translate
    useEffect(() => {
        if (typeof window === 'undefined') return;

        (window as any).googleTranslateElementInit = () => {
            try {
                if (!(window as any).google?.translate?.TranslateElement) return;
                const container = document.getElementById('google_translate_element');
                if (!container) return;

                container.innerHTML = '';
                new (window as any).google.translate.TranslateElement(
                    {
                        pageLanguage: 'en',
                        includedLanguages: 'en,hi,mr,gu,ta,te,kn,ml,pa,ur,bn,or,as,ne,sd,sa',
                        layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
                        autoDisplay: false,
                    },
                    'google_translate_element'
                );
            } catch (e) {
                console.error('Google Translate init failed:', e);
            }
        };

        const existing = document.querySelector('script[data-google-translate="1"]') as HTMLScriptElement | null;
        if (existing) {
            if ((window as any).google?.translate?.TranslateElement) {
                (window as any).googleTranslateElementInit();
            }
            return;
        }

        const script = document.createElement('script');
        script.setAttribute('data-google-translate', '1');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.onerror = () => console.error('Failed to load Google Translate');
        document.head.appendChild(script);
    }, []);

    // Restore language preference from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const storedLang = localStorage.getItem('googleTranslateLang');
        if (!storedLang) return;

        if (storedLang !== 'en') {
            setIsTranslated(true);
            const found = languageList.find((l) => l.code === storedLang);
            setTranslatedLangName(found ? found.name : storedLang);
        }

        setGoogTransCookie(storedLang);

        let attempts = 0;
        const interval = window.setInterval(() => {
            attempts += 1;
            const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
            if (select) {
                select.value = storedLang;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                window.clearInterval(interval);
            }
            if (attempts > 20) {
                window.clearInterval(interval);
            }
        }, 400);

        return () => window.clearInterval(interval);
    }, []);

    return (
        <>
            {/* Hidden Google Translate Widget */}
            <div
                id="google_translate_element"
                style={{
                    position: 'fixed',
                    bottom: '-100px',
                    left: '-100px',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                }}
            />

            {/* ── Language Picker Modal ── */}
            {showTranslate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowTranslate(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Select Language</h3>
                            <button
                                onClick={() => setShowTranslate(false)}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 gap-2">
                                {languageList.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code, lang.name)}
                                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <span className="text-2xl">{lang.flag}</span>
                                        <span className="font-medium">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Floating Translate Icon ── */}
            {isTranslated && (
                <div className="fixed bottom-[90px] right-5 z-40 flex flex-col items-end">
                    {/* Popup menu */}
                    {showFloatingMenu && (
                        <div className="mb-3 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button
                                onClick={() => {
                                    setShowFloatingMenu(false);
                                    setShowTranslate(true);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                            >
                                <Globe className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Translate into…</p>
                                    <p className="text-xs text-gray-500">Currently: {translatedLangName}</p>
                                </div>
                            </button>
                            <button
                                onClick={showOriginal}
                                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                            >
                                <RotateCcw className="w-5 h-5 text-orange-500" />
                                <p className="text-sm font-semibold text-gray-900">Show Original</p>
                            </button>
                        </div>
                    )}

                    {/* Floating icon button */}
                    <button
                        onClick={() => setShowFloatingMenu(!showFloatingMenu)}
                        className="w-12 h-12 mr-1 rounded-full bg-[#16a34a] text-white shadow-lg shadow-green-600/30 ring-2 ring-white/50 hover:shadow-xl hover:bg-[#15803d] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
                        title="Translation Options"
                    >
                        <span className="text-[13px] font-bold tracking-wide leading-none mt-0.5">भाषा</span>
                    </button>
                </div>
            )}

            {/* Backdrop to close floating menu */}
            {showFloatingMenu && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowFloatingMenu(false)}
                />
            )}
        </>
    );
}
