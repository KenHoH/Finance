---
trigger: manual
---

Act as a senior security engineer and red team specialist. perform a comprehensive, adversarial security audit of the following codebase. Assume the system will be deployed in a hostile environment with motivated attackers.

Analyze the system across alll layers, including Frontend (UI, client log, browser storage). Backend (APIs, business logic, services). Authenthication and authorization flows. Database interactions and storage. Infrastructure and deployment assumptions. Third party integrationss and dependencies.

Using the codebase from previous audit scope, identify vulnerabilities across all severity levels. Detect logic flaws, not just known patterns. Surface chained attack paths. Highlight unknown or unconventional weaknesses. Assume attacker creavitiy beyond standart checklists.

Build a threat model: Define possible attacker profiles (anonymous user, authenthicated user, insider, API consumer). Identify entry points and trust boundaries. Map out sensitive assets (data tokens, permissions, secrets)

Now audit authenthication and input handling. Check for (but do not limit yourself to): Authenthication and authorizxation: broken auth, weak session management, previllege escalation. Insecure password reset flows. Token leakage or reuse
Input handling: Injection attacks (SQL, NoSQL, OS command, template injection). XSS (Store reflected, DOM based). CSRF Vulnerabilities. FIle upload exploits

Next, audit daata security and backend logic across the codebase:
Data security: Sensitive data exposure. Weak encryption or misuse or cryptography. Hardcoded secrets or keys. Insecure storage (local storage, cookies, logs).

API and backend logic: broken object level authorization (IDOR / BOLA). Mass assignment vulnerabilities. Rate limitting issues/bruteforce risk. Business logic abuse (race conditions, double spending, bypassing checks)

Now audit infrastructure configuration and third party dependencies:
Infrastructure and configuration: Misconfigured headers (CORS, CSP, HSTS). Open ports, debug endpoints, admin panels. ENvironment variable leaks. Cloud/storage misconfigurations.
Dependencies and Supply chain: vulnerable packages. Unsafe imports or execution. Malicious dependency risks

GO Beyond standart checklists. Actively attempt to discover: Non ovious logic flaws unique to this system. Feature abuse scenarios. State desynchronization issues. Cache poisoning. Reply attacks. Timing attacks. Multi step exploit chains combining low severity issues. Any behaviour that should not be possible but is.
Think like an attacker trying to break ssumptions. Attempt to bypass validations and safeguards. Manipulate edge cases and unexpected inputs. Explore how different components interact under stress

Present your complete audit findings in this format
1. VUlnerability summary (total issues by severity)
2. Detailed findings (title, severity, affected component, descriiption, exploitation scenario, impact recommended fix)
3. Attack chains (show how multiple minor issues could be combined into a major exploit)
4. Secure design recomendations (architectural improvements and safe patterns)

Do not assume the code is safe. Do not skip analysis due to missing context, infer risks where needed. Be exhaustive and paranoid in your review . If unsure, flag it as a potential risk and explai why