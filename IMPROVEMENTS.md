# Event Booking Form - Improvement Recommendations

## Summary

**Current Status**: Build passing, 13/13 tests passing, 68.11% code coverage

## Bugs Fixed in This Session

1. **Undefined eventName in log output** (`app.js:203`) - Now defaults to "Untitled Event"
2. **Undefined SMTP_USERNAME in email from field** (`app.js:193`) - Now defaults to "noreply@rotmanav.ca"

---

## Priority Improvements

### High Priority - Security

- [ ] **Input Sanitization**: Add HTML/XSS sanitization for user input before including in emails (use `escape-html` or similar)
- [ ] **CSRF Protection**: Add CSRF tokens to the form submission endpoint
- [ ] **Rate Limiting**: Implement rate limiting on `/api/submit` to prevent spam (use `express-rate-limit`)
- [ ] **Email Validation**: Add server-side email format validation

### High Priority - Reliability

- [ ] **Time Validation**: Ensure schedule times are in correct order (registration < start < end < shutdown)
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

- [ ] **ESLint Configuration**: Add `.eslintrc.js` with recommended rules
- [ ] **Prettier Configuration**: Add `.prettierrc` for consistent formatting
- [ ] **TypeScript Migration**: Convert to TypeScript for type safety (optional, long-term)
- [ ] **Environment Validation**: Validate required env vars at startup

---

## Low Priority - Enhancements

### Backend Enhancements

- [ ] **Health Check Endpoint**: Add `GET /health` for monitoring
- [ ] **API Documentation**: Add OpenAPI/Swagger documentation
- [ ] **Structured Logging**: Replace console.log with a logging library (winston/pino)
- [ ] **Confirmation Emails**: Send confirmation email to the submitter

### Frontend Enhancements

- [ ] **Client-side File Validation**: Validate file size before upload attempt
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
| Hardcoded fallbacks | `app.js:116` | BASE_URL fallback is hardcoded |
| Duplicate space/recording maps | `app.js` + `form.js` | Same mappings exist in both files |

---

## Uncovered Code Paths (from coverage report)

| Lines | Description |
|-------|-------------|
| 14 | Creating uploads directory |
| 19-22 | Multer filename generation |
| 29-32 | Multer file filter |
| 48-57 | Production SMTP setup |
| 62-73 | Ethereal test email setup |
| 208 | Preview URL handling |
| 218-219 | Error handling |
| 245-252 | Server startup |

---

## Quick Wins (< 1 hour each)

1. Add ESLint configuration
2. Add health check endpoint
3. Add rate limiting middleware
4. Add client-side file size validation
5. Extract shared constants (space/recording maps) to a shared file

---

*Generated: 2026-01-20*
