const express = require('express');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email transporter
let transporter = null;

async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_PASSWORD) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD
            }
        });
    } else {
        // Fallback: create test account or use console logging
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        } catch (err) {
            // Console logging fallback
            transporter = {
                sendMail: async (options) => {
                    console.log('EMAIL PREVIEW:', options.subject);
                    return { messageId: 'console-' + Date.now() };
                }
            };
        }
    }
    return transporter;
}

// Helper functions
function formatEventSpace(space) {
    const spaces = {
        'full': 'Event Hall Full',
        'one-third': 'Event Hall 1/3',
        'two-thirds': 'Event Hall 2/3',
        'fleck-atrium': 'Fleck Atrium'
    };
    return spaces[space] || space;
}

function formatRecordingOption(option) {
    const options = {
        'none': 'None - Technician on site only',
        'basic-recording': 'Basic Recording - Fixed wide shot or Zoom',
        'live-web-recording': 'Live Web Recording - Full setup with additional technician'
    };
    return options[option] || option;
}

// Handle form submission
app.post('/api/submit', async (req, res) => {
    try {
        const {
            'event-space': eventSpace,
            'person-of-contact': personOfContact,
            'email-address': emailAddress,
            'event-date': eventDate,
            'event-name': eventName,
            'registration-time': registrationTime,
            'event-start-time': eventStartTime,
            'presentation-end-time': presentationEndTime,
            'shutdown': shutdown,
            'cc-number': ccNumber,
            'cfc-number': cfcNumber,
            'recording-option': recordingOption,
            'other-notes': otherNotes
        } = req.body;

        // Build email HTML
        const emailHtml = `
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">Rotman AV Event Booking</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">New booking request received</p>
                </div>

                <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
                    <h2 style="color: #495057; border-bottom: 2px solid #667eea; padding-bottom: 10px;">${eventName || 'Untitled Event'}</h2>

                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 12px 0; color: #6c757d; width: 40%;">Event Space</td>
                            <td style="padding: 12px 0; font-weight: 500;">${formatEventSpace(eventSpace)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 12px 0; color: #6c757d;">Contact Person</td>
                            <td style="padding: 12px 0; font-weight: 500;">${personOfContact}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 12px 0; color: #6c757d;">Email</td>
                            <td style="padding: 12px 0;"><a href="mailto:${emailAddress}">${emailAddress}</a></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 12px 0; color: #6c757d;">Event Date</td>
                            <td style="padding: 12px 0; font-weight: 500;">${eventDate}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 12px 0; color: #6c757d;">Recording Option</td>
                            <td style="padding: 12px 0; font-weight: 500;">${formatRecordingOption(recordingOption)}</td>
                        </tr>
                    </table>

                    <h3 style="color: #495057; margin-top: 25px;">Schedule</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: white; padding: 15px; border-radius: 8px;">
                        <div><span style="color: #6c757d; display: block; font-size: 12px;">Registration</span><strong>${registrationTime}</strong></div>
                        <div><span style="color: #6c757d; display: block; font-size: 12px;">Event Start</span><strong>${eventStartTime}</strong></div>
                        <div><span style="color: #6c757d; display: block; font-size: 12px;">Presentation End</span><strong>${presentationEndTime}</strong></div>
                        <div><span style="color: #6c757d; display: block; font-size: 12px;">Shutdown</span><strong>${shutdown}</strong></div>
                    </div>

                    ${(ccNumber || cfcNumber) ? `
                    <h3 style="color: #495057; margin-top: 25px;">Budget Numbers</h3>
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        ${ccNumber ? `<p style="margin: 5px 0;"><strong>CC#:</strong> ${ccNumber}</p>` : ''}
                        ${cfcNumber ? `<p style="margin: 5px 0;"><strong>CFC#:</strong> ${cfcNumber}</p>` : ''}
                    </div>
                    ` : ''}

                    ${otherNotes ? `
                    <h3 style="color: #495057; margin-top: 25px;">Additional Notes</h3>
                    <div style="background: white; padding: 15px; border-radius: 8px;">
                        <p style="margin: 0; white-space: pre-wrap;">${otherNotes}</p>
                    </div>
                    ` : ''}
                </div>

                <div style="background: #495057; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px;">
                    Rotman AV Services
                </div>
            </body>
            </html>
        `;

        // Send email
        const emailTransporter = await getTransporter();
        const mailOptions = {
            from: `"AV Booking Form" <${process.env.SMTP_USERNAME || 'noreply@example.com'}>`,
            to: process.env.EMAIL_TO || 'cameron.ashley@utoronto.ca',
            replyTo: emailAddress,
            subject: `New Event Request: ${eventName || 'Untitled Event'}`,
            html: emailHtml
        };

        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`Booking submitted: ${eventName} on ${eventDate}`);

        const previewUrl = nodemailer.getTestMessageUrl(info);

        res.json({
            success: true,
            message: 'Booking submitted successfully!',
            previewUrl: previewUrl || null
        });

    } catch (error) {
        console.error('Error processing booking:', error.message);
        res.status(500).json({ success: false, message: 'Failed to submit booking. Please try again.' });
    }
});

// Export for Vercel serverless
module.exports = app;
