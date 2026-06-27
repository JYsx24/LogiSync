# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`master`) | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, email **jackxuan0822@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix (optional)

You will receive a response within **48 hours** acknowledging receipt. We will work with you to understand and resolve the issue before any public disclosure.

## Scope

The following are in scope:

- Authentication bypass or session fixation
- Firestore rules that allow unauthorised data access
- XSS or injection vulnerabilities in the React frontend
- Exposure of Firebase API credentials

The following are **out of scope**:

- Vulnerabilities in third-party dependencies (report those upstream)
- Issues that require physical access to a device
- Social engineering attacks

## Firebase Configuration Note

This project uses Firebase. Each deployer is responsible for configuring their own Firebase project with appropriate security rules. The rules provided in the README are a recommended baseline — review and tighten them for your specific use case before going to production.
