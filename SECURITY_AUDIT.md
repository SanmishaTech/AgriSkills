# Security Hardening Report

This document details the security improvements implemented to harden the Agriskills platform against common vulnerabilities and exploits.

## Actions Performed

### 1. Patched Vulnerable Dependencies
We resolved 17 potential vulnerabilities across internal Node.js packages by executing `npm audit fix --force --legacy-peer-deps`. This updated critical libraries (e.g., `tar`, `quill`) to newer, secure versions that address known Common Vulnerabilities and Exposures (CVEs).

### 2. Enhanced File Upload Security (Anti-Malware)
To prevent malicious scripts (like viruses or backdoors disguised as benign images) from entering the server, we strictly locked down the main file upload route (`/api/upload/route.ts`).
- **File Size Limit introduced**: Added a strict checking mechanism rejecting payloads above 5MB.
- **Deep File Inspection**: The server no longer trusts just the file extension (e.g. `.png`). It now strips the file down and mathematically analyzes the payload's "magic numbers" (internal file signature) to prove it is genuinely an image (JPEG, PNG, or WebP).
- **Mandatory File Sanitization**: Any file that passes inspection is immediately renamed to a random, unguessable string using the cryptographic `randomUUID()` pattern. This stops attackers from using payload filenames designed to hijack server scripts.

### 3. Eliminated Authentication Defaults
In the authentication module (`src/lib/auth.ts`), the application's digital signing module previously included a fallback development key for JWT tokens.
- We removed the fallback key completely (`'your-secret-key'`).
- The system will proactively crash (`FATAL ERROR`) on boot if a real, strong cryptographic key isn't provided via environment variables, effectively killing the possibility of an attacker guessing the fallback signature.

### 4. Applied Browser Security Headers
We added comprehensive security headers to `next.config.js` to instruct any visiting web browser to turn on maximum security shields for this application.
- **Content-Security-Policy (CSP)**: Locks down which scripts and images the page is allowed to load. I have specifically whitelisted:
    - **YouTube**: For all course and shorts videos.
    - **Unsplash**: For the login and landing page hero images.
    - **Google Translate**: For language switching (including `gstatic.com` for styles and `translate-pa.googleapis.com` for scripts).
    - **FlagCDN**: For the country flags in the translator.
    - **Google Gemini AI**: For the AI-powered features.
- **X-Frame-Options (`SAMEORIGIN`)**: Defends against Clickjacking by forbidding malicious websites from loading your site into invisible frames.
- **X-Content-Type-Options (`nosniff`)**: Blocks MIME-type sniffing vulnerabilities.
- **X-XSS-Protection (`1; mode=block`)**: Tells legacy browsers to actively scan and block injected malicious scripts.

## Verification

- **Dependency Scan**: The audit reported 0 remaining high/critical vulnerabilities after patches were installed.
- **Build Status**: Verified via `bun run build`. All security rules were bundled naturally without affecting existing logic flows.
- **Live Upload Test**: Confirmed that the server successfully blocks fake images pretending to be real.
