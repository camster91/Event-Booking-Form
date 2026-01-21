const request = require('supertest');
const path = require('path');
const {
    app,
    initializeEmailTransporter,
    formatEventSpace,
    formatRecordingOption,
    validateEmail,
    validateTimeOrder,
    sanitizeForEmail
} = require('../app');

// Initialize email transporter before tests (will use console logging fallback)
beforeAll(async () => {
    await initializeEmailTransporter();
});

describe('Helper Functions', () => {
    describe('formatEventSpace', () => {
        it('should format "full" to "Event Hall Full"', () => {
            expect(formatEventSpace('full')).toBe('Event Hall Full');
        });

        it('should format "one-third" to "Event Hall 1/3"', () => {
            expect(formatEventSpace('one-third')).toBe('Event Hall 1/3');
        });

        it('should format "two-thirds" to "Event Hall 2/3"', () => {
            expect(formatEventSpace('two-thirds')).toBe('Event Hall 2/3');
        });

        it('should format "fleck-atrium" to "Fleck Atrium"', () => {
            expect(formatEventSpace('fleck-atrium')).toBe('Fleck Atrium');
        });

        it('should return unknown values as-is', () => {
            expect(formatEventSpace('unknown-space')).toBe('unknown-space');
        });
    });

    describe('formatRecordingOption', () => {
        it('should format "none" correctly', () => {
            expect(formatRecordingOption('none')).toBe('None - Technician on site only');
        });

        it('should format "basic-recording" correctly', () => {
            expect(formatRecordingOption('basic-recording')).toBe('Basic Recording - Fixed wide shot or Zoom');
        });

        it('should format "live-web-recording" correctly', () => {
            expect(formatRecordingOption('live-web-recording')).toBe('Live Web Recording - Full setup with additional technician');
        });

        it('should return unknown values as-is', () => {
            expect(formatRecordingOption('custom-option')).toBe('custom-option');
        });
    });

    describe('validateEmail', () => {
        it('should return true for valid email addresses', () => {
            expect(validateEmail('user@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.org')).toBe(true);
            expect(validateEmail('user+tag@university.edu')).toBe(true);
        });

        it('should return false for invalid email addresses', () => {
            expect(validateEmail('invalid-email')).toBe(false);
            expect(validateEmail('user@')).toBe(false);
            expect(validateEmail('@domain.com')).toBe(false);
            expect(validateEmail('')).toBeFalsy();
            expect(validateEmail(null)).toBeFalsy();
            expect(validateEmail(undefined)).toBeFalsy();
        });
    });

    describe('validateTimeOrder', () => {
        it('should return valid for correct time order', () => {
            const result = validateTimeOrder('09:00', '10:00', '12:00', '13:00');
            expect(result.valid).toBe(true);
        });

        it('should return valid when registration equals start time', () => {
            const result = validateTimeOrder('10:00', '10:00', '12:00', '13:00');
            expect(result.valid).toBe(true);
        });

        it('should return invalid when registration is after start', () => {
            const result = validateTimeOrder('11:00', '10:00', '12:00', '13:00');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Registration time must be before');
        });

        it('should return invalid when start is after end', () => {
            const result = validateTimeOrder('09:00', '13:00', '12:00', '14:00');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Event start time must be before');
        });

        it('should return invalid when end is after shutdown', () => {
            const result = validateTimeOrder('09:00', '10:00', '15:00', '14:00');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Presentation end time must be before');
        });

        it('should return invalid when any time is missing', () => {
            const result = validateTimeOrder('09:00', '10:00', null, '13:00');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('All time fields are required');
        });
    });

    describe('sanitizeForEmail', () => {
        it('should escape HTML special characters', () => {
            expect(sanitizeForEmail('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        });

        it('should escape ampersands', () => {
            expect(sanitizeForEmail('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        it('should handle empty strings', () => {
            expect(sanitizeForEmail('')).toBe('');
        });

        it('should handle null/undefined', () => {
            expect(sanitizeForEmail(null)).toBe('');
            expect(sanitizeForEmail(undefined)).toBe('');
        });

        it('should convert numbers to strings', () => {
            expect(sanitizeForEmail(12345)).toBe('12345');
        });
    });
});

describe('API Endpoints', () => {
    describe('GET /', () => {
        it('should serve the index.html page', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/html/);
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.timestamp).toBeDefined();
            expect(response.body.uptime).toBeDefined();
            expect(response.body.email).toBeDefined();
        });
    });

    describe('POST /api/submit', () => {
        it('should accept valid form data', async () => {
            const formData = {
                'event-space': 'full',
                'person-of-contact': 'John Doe',
                'email-address': 'john@example.com',
                'event-date': '2025-12-15',
                'event-name': 'Test Event',
                'registration-time': '09:00',
                'event-start-time': '10:00',
                'presentation-end-time': '12:00',
                'shutdown': '13:00',
                'recording-option': 'basic-recording'
            };

            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send(formData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('successfully');
        });

        it('should handle form data with optional fields', async () => {
            const formData = {
                'event-space': 'two-thirds',
                'person-of-contact': 'Jane Smith',
                'email-address': 'jane@example.com',
                'event-date': '2025-11-20',
                'event-name': 'Conference 2025',
                'registration-time': '08:30',
                'event-start-time': '09:00',
                'presentation-end-time': '17:00',
                'shutdown': '18:00',
                'recording-option': 'live-web-recording',
                'cc-number': '12345',
                'cfc-number': '67890',
                'other-notes': 'Please provide extra chairs'
            };

            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send(formData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should handle form submission without event name', async () => {
            const formData = {
                'event-space': 'fleck-atrium',
                'person-of-contact': 'Bob Wilson',
                'email-address': 'bob@example.com',
                'event-date': '2025-10-10',
                'registration-time': '14:00',
                'event-start-time': '15:00',
                'presentation-end-time': '16:00',
                'shutdown': '17:00',
                'recording-option': 'none'
            };

            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send(formData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject invalid email address', async () => {
            const formData = {
                'event-space': 'full',
                'person-of-contact': 'John Doe',
                'email-address': 'invalid-email',
                'event-date': '2025-12-15',
                'event-name': 'Test Event',
                'registration-time': '09:00',
                'event-start-time': '10:00',
                'presentation-end-time': '12:00',
                'shutdown': '13:00',
                'recording-option': 'basic-recording'
            };

            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send(formData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('email');
        });

        it('should reject invalid time order (registration after start)', async () => {
            const formData = {
                'event-space': 'full',
                'person-of-contact': 'John Doe',
                'email-address': 'john@example.com',
                'event-date': '2025-12-15',
                'event-name': 'Test Event',
                'registration-time': '11:00',
                'event-start-time': '10:00',
                'presentation-end-time': '12:00',
                'shutdown': '13:00',
                'recording-option': 'basic-recording'
            };

            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send(formData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Registration time');
        });

        it('should reject invalid time order (end after shutdown)', async () => {
            const formData = {
                'event-space': 'full',
                'person-of-contact': 'John Doe',
                'email-address': 'john@example.com',
                'event-date': '2025-12-15',
                'event-name': 'Test Event',
                'registration-time': '09:00',
                'event-start-time': '10:00',
                'presentation-end-time': '15:00',
                'shutdown': '14:00',
                'recording-option': 'basic-recording'
            };

            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send(formData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Presentation end time');
        });

        it('should sanitize XSS attempts in user input', async () => {
            const formData = {
                'event-space': 'full',
                'person-of-contact': '<script>alert("xss")</script>',
                'email-address': 'john@example.com',
                'event-date': '2025-12-15',
                'event-name': '<img onerror="alert(1)" src="x">',
                'registration-time': '09:00',
                'event-start-time': '10:00',
                'presentation-end-time': '12:00',
                'shutdown': '13:00',
                'recording-option': 'basic-recording',
                'other-notes': '<a href="javascript:alert(1)">Click me</a>'
            };

            const response = await request(app)
                .post('/api/submit')
                .type('form')
                .send(formData);

            // Should still succeed - input is sanitized, not rejected
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
