## 1. Vulnerability Summary

| Severity | Count | Categories |
|----------|-------|-----------|
| **Critical** | 3 | Data Exposure, Authentication Bypass, File Upload |
| **High** | 6 | Auth/Session, Logging, Input Validation |
| **Medium** | 7 | API Logic, Infrastructure, Data Integrity |
| **Low** | 4 | Code Quality, Configuration |
| **Total** | **20** | |

---

## 2. Detailed Findings

### CRITICAL-001: OAuth Tokens Stored in Plaintext
- **Severity:** Critical
- **Affected Component:** `AuthIdentities` model / `auth.service.ts`, `email.service.ts`
- **Description:** Google OAuth `access_token` and `refresh_token` are stored in the PostgreSQL database in plaintext (`@db.Text`). These tokens grant access to users' Gmail accounts.
- **Exploitation Scenario:** Database breach or SQL injection allows attacker to read all OAuth tokens, gaining unauthorized access to every user's Gmail inbox. With `https://mail.google.com/` scope, full email read access is compromised.
- **Impact:** Complete compromise of all users' Google/Gmail accounts linked to the application.
- **Recommended Fix:**
  - Encrypt tokens at rest using AES-256-GCM with a KMS-managed key.
  - Use `prisma.$extends` or middleware to auto-encrypt/decrypt sensitive fields.
  - Rotate existing tokens immediately after fix deployment.

**Code Reference:**
```ts
// prisma/schema.prisma
model AuthIdentities {
  accessToken   String?   @db.Text   // PLAINTEXT
  refreshToken  String?   @db.Text   // PLAINTEXT
}
```

---

### CRITICAL-002: Unauthenticated Pub/Sub Endpoint
- **Severity:** Critical
- **Affected Component:** `pubsub.controller.ts`, `pubsub.service.ts`
- **Description:** The `POST /pubsub` endpoint has **no authentication guard**, **no authorization check**, and **no signature verification** for incoming Google Pub/Sub messages. The `CsrfGuard` explicitly bypasses this endpoint (`request.path === '/email'`), but the actual path is `/pubsub`.
- **Exploitation Scenario:** Any attacker can POST a crafted Pub/Sub message to trigger email processing for arbitrary users. By providing a valid email address in the payload, the attacker triggers Gmail API calls using the victim's stored refresh token, potentially reading their emails or creating fraudulent transactions.
- **Impact:** Unauthorized access to all users' Gmail data, ability to create fake transactions, potential data exfiltration.
- **Recommended Fix:**
  - Add `@UseGuards(JwtAuthGuard)` or implement Pub/Sub push subscription token validation.
  - Verify the `Authorization: Bearer <token>` header from Google Cloud.
  - Add path-based rate limiting specifically for `/pubsub`.
  - Remove the incorrect bypass in `CsrfGuard` (`request.path === '/email'`).

**Code Reference:**
```ts
// src/modules/pubsub/pubsub.controller.ts
@Controller('pubsub')
export class PubsubController {
    @Post()
    async handlePubSubMessage(@Req() request: any) {  // NO GUARD, NO VALIDATION
        const { message } = request.body;
        await this.pubsubService.processEmails(message);
    }
}
```

---

### CRITICAL-003: Unvalidated File Upload in Receipt Scanning
- **Severity:** Critical
- **Affected Component:** `receipt.controller.ts`, `receipt.service.ts`
- **Description:** The receipt upload endpoint (`POST /receipts/scan`) accepts any file via `FileInterceptor('image')` with **no file size limit**, **no MIME type validation**, and **no virus scanning**. The file is then forwarded to an external OCR service.
- **Exploitation Scenario:**
  1. Attacker uploads a malicious file (e.g., executable, zip bomb, or polyglot image).
  2. Server forwards it to the OCR microservice, potentially compromising that service.
  3. Alternatively, attacker uploads extremely large files causing memory exhaustion (DoS).
- **Impact:** Service compromise, DoS, potential SSRF if OCR service is exploited.
- **Recommended Fix:**
  - Add file type whitelist (`image/png`, `image/jpeg`, `image/webp`).
  - Add file size limit (max 5MB).
  - Use `sharp` to validate and sanitize image dimensions before forwarding.
  - Scan uploads with ClamAV or similar.

**Code Reference:**
```ts
// src/modules/receipt/framework/receipt.controller.ts
@Post('scan')
@UseInterceptors(FileInterceptor('image'))  // NO VALIDATION
async scanReceipt(@UploadedFile() file: Express.Multer.File) {
    return this.receiptService.scanReceipt(file);
}
```

---

### HIGH-001: CSRF Token in Non-HttpOnly Cookie
- **Severity:** High
- **Affected Component:** `csrf-token.ts`, `auth.controller.ts`
- **Description:** The CSRF token is stored in a cookie with `httpOnly: false`, making it readable by JavaScript. While CSRF tokens are typically non-httpOnly, the 7-day maxAge combined with `sameSite: 'lax'` creates a window for XSS-based token theft.
- **Exploitation Scenario:** If an XSS vulnerability exists (e.g., via `SanitizeInterceptor` bypass), attacker JavaScript can read the CSRF token and make authenticated state-changing requests.
- **Impact:** Privilege escalation via XSS + CSRF token theft.
- **Recommended Fix:**
  - Reduce CSRF cookie `maxAge` to session-only or 1 hour.
  - Implement double-submit cookie pattern with token rotation per request.
  - Add `__Host-` prefix to cookie name for additional binding.

**Code Reference:**
```ts
// src/infrastructure/utils/csrf-token.ts
export function setCsrfCookie(res: Response, token: string){
    res.cookie('csrf-token', token, {
        httpOnly: false,     // READABLE BY JS
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 DAYS
    });
}
```

---

### HIGH-002: Sensitive Data Logged to Console
- **Severity:** High
- **Affected Component:** `google-oauth.service.ts`, `email.service.ts`
- **Description:** `console.log` statements output sensitive information including OAuth tokens (presence indicators), user email addresses, email body content, and Google profile data. These logs may be captured by log aggregation systems or Docker stdout.
- **Exploitation Scenario:** Log files or monitoring dashboards expose user data to anyone with infrastructure access. In containerized environments, logs are often accessible to DevOps/QA teams.
- **Impact:** Information disclosure, privacy violation, potential credential exposure.
- **Recommended Fix:**
  - Replace all `console.log` with `Logger` at appropriate levels.
  - Never log tokens, emails, or personal data.
  - Use structured logging with PII redaction.

**Code References:**
```ts
// src/modules/auth/core/app/google-oauth.service.ts
console.log('token received', { hasAccess: !!tokens.access_token, hasRefresh: !!tokens.refresh_token });
console.log('user profile = ', { email: data.email, name: data.name });

// src/modules/email/core/app/email.service.ts
this.logger.log(`Email Body: ${emailBody}`);
this.logger.log(`Successfully fetched email: ${emailResponse.data.snippet}`);
```

---

### HIGH-003: getMe Returns Wrong isInvalid Flag
- **Severity:** High
- **Affected Component:** `auth.service.ts`
- **Description:** When a JWT token is valid but the user no longer exists in the database, `getMe` returns `{user: null, isInvalid: false}`. The caller (`auth.controller.ts`) only clears the cookie when `isInvalid === true`, so the invalid session cookie persists.
- **Exploitation Scenario:** Deleted/banned users continue to have a valid-looking session cookie. Combined with other issues, this can lead to confused deputy attacks or session fixation.
- **Impact:** Session management flaw, potential for stale session abuse.
- **Recommended Fix:**
  - Change `return {user: null, isInvalid: false}` to `return {user: null, isInvalid: true}` when user not found.

**Code Reference:**
```ts
// src/modules/auth/core/app/auth.service.ts
if(!user){
    return {user: null, isInvalid: false};  // SHOULD BE true
}
```

---

### HIGH-004: OAuth State Parameter Not Cryptographically Signed
- **Severity:** High
- **Affected Component:** `auth.service.ts`
- **Description:** The OAuth `state` parameter is Base64url-encoded JSON with no HMAC signature. An attacker can decode, modify the `returnTo` URL, re-encode, and send victims to arbitrary domains after OAuth completion.
- **Exploitation Scenario:**
  1. Attacker crafts a malicious `state` with `returnTo: https://evil.com`.
  2. Victim completes Google OAuth.
  3. Backend redirects to `evil.com` with the JWT cookie (which may not be sent cross-origin, but the redirect itself is abused).
- **Impact:** Open Redirect, potential phishing vector.
- **Recommended Fix:**
  - Sign `state` with HMAC-SHA256 using `JWT_SECRET`.
  - Verify signature in `decodeOauthState` before processing.
  - Alternatively, store `returnTo` server-side with a random nonce.

**Code Reference:**
```ts
// src/modules/auth/core/app/auth.service.ts
private encodeOauthState(returnTo?: string){
    return Buffer.from(JSON.stringify({returnTo}), 'utf8').toString('base64url');  // NO SIGNATURE
}
```

---

### HIGH-005: No Rate Limiting on Authentication Endpoints
- **Severity:** High
- **Affected Component:** `auth.controller.ts`, `app.module.ts`
- **Description:** The global rate limiter allows 40 requests per minute per IP across ALL endpoints. There is no stricter rate limiting on auth endpoints (`/auth/google`, `/auth/me`, `/auth/logout`).
- **Exploitation Scenario:** Attacker can exhaust the rate limit with automated requests, causing DoS for legitimate users behind NAT (shared IP). Brute force against session tokens is also not specifically throttled.
- **Impact:** DoS, potential brute force amplification.
- **Recommended Fix:**
  - Add `@Throttle(5, 60)` on auth controller for login attempts.
  - Use separate rate limit tiers for auth vs. API.
  - Consider CAPTCHA after repeated failures.

**Code Reference:**
```ts
// src/app.module.ts
ThrottlerModule.forRoot([{ ttl: 60000, limit: 40 }]),  // GLOBAL, NOT SPECIFIC TO AUTH
```

---

### HIGH-006: SanitizeInterceptor Insufficient for XSS Prevention
- **Severity:** High
- **Affected Component:** `sanitize.interceptor.ts`
- **Description:** The `SanitizeInterceptor` only strips HTML tags (`/<[^>]*>/g`). It does NOT prevent:
  - JavaScript protocol URLs (`javascript:alert(1)`)
  - Event handlers in attributes (`onerror=alert(1)`)
  - HTML entity encoding bypasses
  - JSON-based XSS (reflected in API responses)
- **Exploitation Scenario:** Attacker stores `<img src=x onerror=alert(1)>` in a transaction description. The regex strips `<img>` but leaves `src=x onerror=alert(1)`, which may still execute in certain contexts.
- **Impact:** Stored XSS in client-side rendering of transaction descriptions, bill titles, etc.
- **Recommended Fix:**
  - Replace custom regex with DOMPurify or similar robust HTML sanitizer.
  - Implement Content Security Policy (CSP) headers.
  - Escape output on the frontend as defense-in-depth.

**Code Reference:**
```ts
// src/infrastructure/interceptors/sanitize.interceptor.ts
function stripTags(value: string): string {
    return value.replace(/<[^>]*>/g, '');  // INSUFFICIENT
}
```

---

### MEDIUM-001: Swagger UI Exposed in All Environments
- **Severity:** Medium
- **Affected Component:** `main.ts`
- **Description:** Swagger UI (`/api`) is enabled unconditionally in all environments. It exposes full API schema, DTOs, and endpoint descriptions.
- **Exploitation Scenario:** Attackers enumerate endpoints, understand business logic, and craft targeted attacks. The Swagger description even documents the CSRF bypass mechanism.
- **Impact:** Information disclosure, API enumeration.
- **Recommended Fix:**
  - Only enable Swagger in development (`process.env.NODE_ENV !== 'production'`).
  - Add basic auth or IP whitelist for Swagger in staging.

---

### MEDIUM-002: Missing Security Headers Configuration
- **Severity:** Medium
- **Affected Component:** `main.ts`
- **Description:** Helmet is used with default configuration. No explicit Content Security Policy (CSP), Strict-Transport-Security (HSTS), or Referrer-Policy is configured.
- **Impact:** Missing defense-in-depth against XSS, clickjacking, and MITM attacks.
- **Recommended Fix:**
  ```ts
  app.use(helmet({
      contentSecurityPolicy: {
          directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"], // adjust as needed
          },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
  ```

---

### MEDIUM-003: No Category Ownership Validation
- **Severity:** Medium
- **Affected Component:** `transaction.service.ts`, `budget.service.ts`
- **Description:** When creating transactions or budgets, the `categoryId` is accepted from user input without verifying the category belongs to the authenticated user. The `Category` model has `userId?` (nullable), meaning global/shared categories exist.
- **Exploitation Scenario:** Attacker creates a transaction using another user's `categoryId`, polluting their category statistics or bypassing budget checks.
- **Impact:** Data integrity issues, potential BOLA bypass.
- **Recommended Fix:**
  - In `create()` methods, verify `categoryId` is either null or belongs to `userId`.
  - Add database constraint or application-level check.

---

### MEDIUM-004: Transaction findAll Pagination Bug
- **Severity:** Medium
- **Affected Component:** `transaction.service.ts`
- **Description:** The `findAll` method has two bugs:
  1. `cursorId` is incorrectly assigned from `filters?.categoryId` instead of a dedicated cursor field.
  2. When `limit` is `0` or `cursorId` is undefined, it returns ALL transactions without pagination, ignoring filter parameters (`type`, `categoryId`, `startDate`, `endDate`).
- **Impact:** Potential data exposure if `limit=0` is passed; broken pagination logic.
- **Recommended Fix:**
  - Use dedicated `cursor` parameter separate from `categoryId`.
  - Always apply `where` filters regardless of pagination mode.
  - Validate `limit` is a positive integer.

**Code Reference:**
```ts
const cursorId = filters?.categoryId;  // WRONG: should be a separate cursor field
const limit = Number(filters?.limit);
if (limit == undefined || cursorId == undefined) {
    const allData = await this.prisma.transaction.findMany({ where: { userId } });  // IGNORES FILTERS
}
```

---

### MEDIUM-005: Type Safety Issues with `any` Types
- **Severity:** Medium
- **Affected Component:** Multiple files
- **Description:** Multiple services use `any` type for parameters, bypassing TypeScript's type checking:
  - `transaction: any` in `checkBudgetAlert` and `checkBudgetOverall`
  - `message: any` in `processEmails`
  - `request: any` in `PubsubController`
  - `payload: any` in `extractEmailBody`
- **Impact:** Runtime errors, potential injection of unexpected data structures, harder to maintain and audit.
- **Recommended Fix:** Define proper interfaces for all cross-service communication. Use Zod or class-validator for runtime validation of external payloads.

---

### MEDIUM-006: Logging Middleware Logs Full URLs
- **Severity:** Medium
- **Affected Component:** `logging.middleware.ts`
- **Description:** The HTTP logging middleware logs `originalUrl` which may contain sensitive query parameters (e.g., `?token=xxx`, `?email=xxx`).
- **Impact:** PII leakage in logs.
- **Recommended Fix:**
  - Sanitize URLs before logging.
  - Redact known sensitive query parameters.

---

### MEDIUM-007: IMAP Hardcoded Mailbox Name
- **Severity:** Medium
- **Affected Component:** `imap.services.ts`
- **Description:** The IMAP sync hardcodes `'Important Stuff'` as the mailbox name. If this label doesn't exist in the user's Gmail, the sync fails silently or throws an error.
- **Impact:** Reliability issue, potential information disclosure if error details leak.
- **Recommended Fix:**
  - Make mailbox name configurable per user.
  - Fall back to `'INBOX'` if the configured label doesn't exist.

---

### LOW-001: Cookie Secure Flag Environment-Dependent
- **Severity:** Low
- **Affected Component:** `auth.controller.ts`, `csrf-token.ts`
- **Description:** The `secure` flag on cookies is only set in production (`process.env.NODE_ENV === 'production'`). In staging or misconfigured environments, cookies may be sent over HTTP.
- **Impact:** Cookie theft via network sniffing in non-HTTPS environments.
- **Recommended Fix:** Always set `secure: true` and ensure HTTPS is enforced at the infrastructure level.

---

### LOW-002: Exception Filter May Leak Internal Details
- **Severity:** Low
- **Affected Component:** `http-exception.filter.ts`
- **Description:** The global exception filter logs the full stack trace for 500 errors but only returns generic messages to the client. However, Prisma error metadata (field names) is included in the response for `P2002` errors.
- **Impact:** Minor information disclosure about database schema.
- **Recommended Fix:** Sanitize `prismaError.meta?.target` before including in response.

---

### LOW-003: Unused Function with `any` Type
- **Severity:** Low
- **Affected Component:** `transaction.service.ts`
- **Description:** `checkBudgetAlert` is marked as unused but still present in the codebase with `transaction: any` parameter.
- **Impact:** Code bloat, potential confusion for future developers.
- **Recommended Fix:** Remove the unused private method.

---

### LOW-004: Environment Variable Typo
- **Severity:** Low
- **Affected Component:** `.env.example`
- **Description:** `DIRECT_UR=` is misspelled (missing `L`).
- **Impact:** Developer confusion, potential misconfiguration.
- **Recommended Fix:** Correct to `DIRECT_URL=`.

---

## 3. Attack Chains

### Chain A: Pub/Sub Abuse -> Email Exfiltration
1. Attacker discovers the unauthenticated `POST /pubsub` endpoint.
2. Sends crafted message with `emailAddress` of victim.
3. Backend uses victim's stored `refreshToken` to call Gmail API.
4. Attacker can read victim's recent emails or trigger transaction creation.

**Risk:** Critical (unauthenticated access to user emails)

### Chain B: XSS -> CSRF Token Theft -> State-Changing Requests
1. Attacker bypasses weak `SanitizeInterceptor` with crafted HTML.
2. XSS payload reads `document.cookie` to get `csrf-token` (non-httpOnly).
3. Attacker makes authenticated POST requests with stolen CSRF token.
4. Creates fake transactions, modifies budgets, or deletes data.

**Risk:** High (requires XSS vector, but CSRF cookie is exposed)

### Chain C: Open Redirect -> OAuth Token Leak
1. Attacker modifies OAuth `state` parameter to include malicious `returnTo`.
2. Victim completes Google OAuth, backend redirects to attacker-controlled site.
3. Attacker's site captures referrer or uses social engineering to extract session info.

**Risk:** High (phishing vector)

### Chain D: File Upload -> OCR Service Compromise -> Database Access
1. Attacker uploads malicious file to `/receipts/scan`.
2. No validation means any file type reaches the OCR microservice.
3. If OCR service is vulnerable to malicious image parsing, attacker gains foothold.
4. From there, lateral movement to backend or database.

**Risk:** Critical (depends on OCR service vulnerability)

---

## 4. Secure Design Recommendations

### 4.1 Architecture Improvements
1. **Token Vault:** Move all OAuth tokens to a dedicated encrypted token vault (e.g., HashiCorp Vault, AWS Secrets Manager) rather than the application database.
2. **Microservice Isolation:** Run the OCR service in an isolated network with no database access. Use a message queue for communication.
3. **API Gateway:** Place an API gateway in front of the backend to handle rate limiting, WAF, and DDoS protection.

### 4.2 Authentication & Authorization
1. **JWT Refresh Tokens:** Implement short-lived access tokens (15 min) with refresh token rotation.
2. **Session Binding:** Bind sessions to IP/User-Agent fingerprints to detect session hijacking.
3. **OAuth Hardening:** Use PKCE for OAuth flows and cryptographically sign the `state` parameter.

### 4.3 Input Handling
1. **Zod Validation:** Replace `class-validator` with Zod for runtime schema validation of all external inputs, including Pub/Sub messages and email payloads.
2. **Image Sanitization:** Use `sharp` to re-encode all uploaded images, stripping metadata and validating dimensions.
3. **DOMPurify:** Replace the custom `stripTags` regex with DOMPurify for HTML sanitization.

### 4.4 Infrastructure
1. **Security Headers:** Configure explicit CSP, HSTS, and Referrer-Policy via Helmet.
2. **Swagger Lockdown:** Disable Swagger in production or protect it behind authentication.
3. **Log Redaction:** Implement PII redaction in all logging pipelines.
4. **HTTPS Enforcement:** Redirect all HTTP traffic to HTTPS at the load balancer level.

### 4.5 Monitoring & Alerting
1. **Failed Auth Monitoring:** Alert on repeated failed authentication attempts from the same IP.
2. **Unusual OAuth Usage:** Monitor for Gmail API access patterns that deviate from user baselines.
3. **File Upload Monitoring:** Alert on unusual file upload patterns (size, frequency, type).

---

## 5. Requirement Traceability

All findings in this audit are based on the security requirements defined in `.windsurf/rules/security-audit.md`:
- Authentication and authorization flows audited (Sections 2.1, 2.2)
- Input handling and injection risks identified (Sections 2.3, 2.4)
- Data security and backend logic reviewed (Sections 2.5, 2.6)
- Infrastructure and dependencies assessed (Sections 2.7, 2.8)
- Attack chains constructed from combined low-severity issues (Section 3)
- Secure design recommendations provided (Section 4)
