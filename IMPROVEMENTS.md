# Event Booking Form - Improvement Recommendations

## Summary

**Current Status**: Build passing, 31/31 tests passing, 78% code coverage

## Completed Improvements

### Session 1 - Bug Fixes
1. **Undefined eventName in log output** (`app.js:203`) - Now defaults to "Untitled Event"
2. **Undefined SMTP_USERNAME in email from field** (`app.js:193`) - Now defaults to "noreply@rotmanav.ca"

### Session 2 - Security & Validation
1. **Input Sanitization** - Added XSS prevention using `escape-html` library
2. **Rate Limiting** - Added 10 requests per 15 minutes limit on `/api/submit`
3. **Email Validation** - Added server-side email validation using `validator` library
4. **Time Validation** - Added validation ensuring registration <= start < end < shutdown
5. **Client-side File Validation** - Added file size (50MB) and type validation before upload
6. **ESLint Configuration** - Added `eslint.config.js` with lint scripts
7. **Health Check Endpoint** - Added `GET /health` for monitoring
8. **Comprehensive Tests** - Added 18 new tests (31 total), coverage improved to 78%

---

## Remaining Improvements

### High Priority - Security

- [ ] **CSRF Protection**: Add CSRF tokens to the form submission endpoint

### High Priority - Reliability

- [ ] **File Upload Cleanup**: Implement periodic cleanup of old uploaded files
- [ ] **Error Handling Tests**: Add tests for error scenarios (file upload errors, email failures)

---

## Medium Priority - Testing

### Increase Test Coverage (Target: 85%+)

- [ ] File upload functionality tests
- [ ] Multer file filter (allowed/rejected file types)
- [ ] SMTP transporter initialization paths
- [ ] Error response handling (500 errors)
- [ ] File size limit enforcement

### Test Infrastructure

- [ ] Add integration tests with real email sending (using Ethereal)
- [ ] Add frontend unit tests (Jest + jsdom or Playwright)
- [ ] Add end-to-end tests (Playwright/Cypress)

---

## Medium Priority - Code Quality

- [x] **ESLint Configuration**: Added `eslint.config.js` with recommended rules
- [ ] **Prettier Configuration**: Add `.prettierrc` for consistent formatting
- [ ] **TypeScript Migration**: Convert to TypeScript for type safety (optional, long-term)
- [ ] **Environment Validation**: Validate required env vars at startup

---

## Low Priority - Enhancements

### Backend Enhancements

- [x] **Health Check Endpoint**: Added `GET /health` for monitoring
- [ ] **API Documentation**: Add OpenAPI/Swagger documentation
- [ ] **Structured Logging**: Replace console.log with a logging library (winston/pino)
- [ ] **Confirmation Emails**: Send confirmation email to the submitter

### Frontend Enhancements

- [x] **Client-side File Validation**: Added file size and type validation
- [ ] **Offline Support**: Add service worker for offline form caching
- [ ] **Accessibility (a11y)**: Add ARIA labels and keyboard navigation improvements
- [ ] **Form Auto-save**: Save form progress to localStorage
- [ ] **Loading States**: Add skeleton loaders for initial page load

### DevOps

- [ ] **CI/CD Pipeline**: Add GitHub Actions workflow for testing
- [ ] **Docker Support**: Add Dockerfile for containerized deployment
- [ ] **Environment Templates**: Add `.env.production.example` and `.env.test.example`

---

## Technical Debt

| Item | Location | Description |
|------|----------|-------------|
| Deprecated packages | `npm install` warnings | `glob@7.2.3` and `inflight@1.0.6` are deprecated |
| Hardcoded fallbacks | `app.js:138` | BASE_URL fallback is hardcoded |
| Duplicate space/recording maps | `app.js` + `form.js` | Same mappings exist in both files |

---

## Quick Wins Completed

1. ~~Add ESLint configuration~~ - Done
2. ~~Add health check endpoint~~ - Done
3. ~~Add rate limiting middleware~~ - Done
4. ~~Add client-side file size validation~~ - Done
5. Extract shared constants (space/recording maps) to a shared file - Pending

---

*Updated: 2026-01-20*
