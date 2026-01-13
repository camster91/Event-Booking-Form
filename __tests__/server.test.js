const request = require('supertest');
const path = require('path');
const { app, initializeEmailTransporter, formatEventSpace, formatRecordingOption } = require('../server');

// Initialize email transporter before tests
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
});

describe('API Endpoints', () => {
    describe('GET /', () => {
        it('should serve the index.html page', async () => {
            const response = await request(app).get('/');
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/html/);
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
    });
});
