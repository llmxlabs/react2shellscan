# Bot Protection & Security 🛡️

This document outlines the security measures implemented to protect the React2Shell Scanner API from automated abuse, bots, and excessive resource consumption.

## 1. Rate Limiting (Upstash Redis)

We use [Upstash Redis](https://upstash.com/) and `@upstash/ratelimit` to implement per-IP rate limiting on the `/api/scan` endpoint.

- **Current Limit**: 5 requests per 10 seconds.
- **Scope**: Per IP address (identified via `x-forwarded-for` header).
- **Implementation**:
  - Uses the **Sliding Window** algorithm for smooth rate limiting.
  - Fail-safe: If Redis is unavailable or environment variables are missing, the API defaults to allowing the request to ensure availability.

### Configuration
Required Environment Variables:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 2. Honeypot Field

A "honeypot" is a hidden form field designed to trap automated bots.

- **Field Name**: `website`
- **Visibility**: 
  - Hidden from real users via CSS (`sr-only`) and excluded from tab order (`tabIndex={-1}`).
  - Visible to bots parsing the HTML DOM.
- **Logic**: If the field contains any value upon submission, the API rejects the request as a bot.

## 3. URL Validation & Filtering

The scanner implements strict URL validation in `@/src/components/ScanForm.tsx` and `@/src/app/api/scan/route.ts`:

- **Protocol Enforcement**: Only `http:` and `https:` are allowed.
- **Private Network Blocking**: Prevents SSRF (Server Side Request Forgery) by blocking:
  - `localhost` / `127.0.0.1`
  - Private IP ranges (`10.x.x.x`, `172.16.x.x`, `192.168.x.x`)
- **Malformed URL Rejection**: Uses `zod` and native `URL` parsing to ensure only valid targets are processed.

## 4. Response Caching

To prevent redundant scanning of the same target and save compute resources:

- **Cache Layer**: Results are cached in the database (Turso/PostgreSQL).
- **Duration**: 1 hour.
- **Logic**: If a URL has been scanned recently, the system returns the cached result instead of performing a new network request to the target.

---
Built by LLMXLabs
