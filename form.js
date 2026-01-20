// Rotman AV Booking - Modern Form Application

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentStep = 1;
    const totalSteps = 4;

    // Elements
    const form = document.getElementById('booking-form');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressFill = document.getElementById('progress-fill');
    const infoPanel = document.getElementById('info-panel');
    const infoToggle = document.getElementById('info-toggle');

    // Initialize date picker
    flatpickr('#event-date', {
        minDate: 'today',
        maxDate: new Date().fp_incr(365),
        dateFormat: 'F j, Y',
        disableMobile: true,
        onChange: function(selectedDates, dateStr) {
            checkBudgetRequired();
        }
    });

    // Step Navigation
    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.step-indicator').forEach(s => {
            s.classList.remove('active');
            if (parseInt(s.dataset.step) < step) {
                s.classList.add('completed');
            } else {
                s.classList.remove('completed');
            }
        });

        // Show current step
        document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
        document.querySelector(`.step-indicator[data-step="${step}"]`).classList.add('active');

        // Update progress bar
        progressFill.style.width = `${(step / totalSteps) * 100}%`;

        // Update buttons
        prevBtn.style.display = step === 1 ? 'none' : 'block';
        nextBtn.style.display = step === totalSteps ? 'none' : 'block';
        submitBtn.style.display = step === totalSteps ? 'block' : 'none';

        // Update review on last step
        if (step === totalSteps) {
            updateReview();
        }

        currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Validate current step
    function validateStep(step) {
        const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        const requiredFields = stepEl.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            field.classList.remove('is-invalid');

            if (field.type === 'radio') {
                const name = field.name;
                const checked = stepEl.querySelector(`input[name="${name}"]:checked`);
                if (!checked) {
                    isValid = false;
                    // Highlight the container
                    const container = field.closest('.space-selector, .recording-options');
                    if (container) {
                        container.style.outline = '2px solid var(--danger)';
                        setTimeout(() => container.style.outline = '', 2000);
                    }
                }
            } else if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
            }
        });

        if (!isValid) {
            // Shake effect
            stepEl.style.animation = 'none';
            stepEl.offsetHeight; // Trigger reflow
            stepEl.style.animation = 'shake 0.5s ease';
        }

        return isValid;
    }

    // Navigation handlers
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep) && currentStep < totalSteps) {
            showStep(currentStep + 1);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    });

    // Time Presets
    const presets = {
        morning: { registration: '08:30', start: '09:00', end: '11:30', shutdown: '12:00' },
        afternoon: { registration: '12:30', start: '13:00', end: '16:30', shutdown: '17:00' },
        evening: { registration: '17:30', start: '18:00', end: '20:30', shutdown: '21:00' },
        fullday: { registration: '08:30', start: '09:00', end: '16:30', shutdown: '17:00' }
    };

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = presets[btn.dataset.preset];
            if (preset) {
                document.getElementById('registration-time').value = preset.registration;
                document.getElementById('event-start-time').value = preset.start;
                document.getElementById('presentation-end-time').value = preset.end;
                document.getElementById('shutdown').value = preset.shutdown;

                // Update active state
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                checkBudgetRequired();
            }
        });
    });

    // Check if budget numbers are required
    function checkBudgetRequired() {
        const dateInput = document.getElementById('event-date');
        const shutdownInput = document.getElementById('shutdown');
        const registrationInput = document.getElementById('registration-time');
        const budgetAlert = document.getElementById('budget-alert');

        if (!dateInput.value || !shutdownInput.value || !registrationInput.value) {
            budgetAlert.style.display = 'none';
            return;
        }

        const date = new Date(dateInput.value);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        const shutdown = shutdownInput.value;
        const registration = registrationInput.value;

        let needsBudget = false;

        // Weekend check
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            const startLimit = '08:00';
            const endLimit = '17:00';
            if (registration < startLimit || shutdown > endLimit) {
                needsBudget = true;
            }
        }
        // Friday
        else if (dayOfWeek === 5) {
            if (registration < '07:00' || shutdown > '18:00') {
                needsBudget = true;
            }
        }
        // Mon-Thu
        else {
            if (registration < '07:00' || shutdown > '20:00') {
                needsBudget = true;
            }
        }

        budgetAlert.style.display = needsBudget ? 'block' : 'none';
    }

    // Time input listeners
    document.querySelectorAll('.time-input').forEach(input => {
        input.addEventListener('change', checkBudgetRequired);
    });

    // Space selector - show relevant info
    document.querySelectorAll('input[name="event-space"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const isFleck = e.target.value === 'fleck-atrium';
            document.getElementById('event-hall-info').style.display = isFleck ? 'none' : 'block';
            document.getElementById('fleck-info').style.display = isFleck ? 'block' : 'none';
        });
    });

    // Info panel toggle
    infoToggle.addEventListener('click', () => {
        infoPanel.classList.toggle('open');
    });

    // File upload handling
    const uploadZone = document.getElementById('upload-zone');
    const uploadInput = document.getElementById('media-upload');
    const uploadPreview = document.getElementById('upload-preview');
    const uploadContent = uploadZone.querySelector('.upload-content');
    const previewName = document.getElementById('preview-name');
    const removeFile = document.getElementById('remove-file');

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

    function validateFile(file) {
        if (file.size > MAX_FILE_SIZE) {
            alert(`File is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
            return false;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('Invalid file type. Please upload an image (JPEG, PNG, GIF) or video (MP4, MOV, AVI, WEBM).');
            return false;
        }
        return true;
    }

    uploadInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!validateFile(file)) {
                uploadInput.value = '';
                return;
            }
            previewName.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
            uploadContent.style.display = 'none';
            uploadPreview.style.display = 'flex';
        }
    });

    removeFile.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadInput.value = '';
        uploadContent.style.display = 'block';
        uploadPreview.style.display = 'none';
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                uploadInput.files = e.dataTransfer.files;
                uploadInput.dispatchEvent(new Event('change'));
            }
        }
    });

    // Update review page
    function updateReview() {
        const spaceMap = {
            'full': 'Event Hall Full',
            'one-third': 'Event Hall 1/3',
            'two-thirds': 'Event Hall 2/3',
            'fleck-atrium': 'Fleck Atrium'
        };

        const recordingMap = {
            'none': { name: 'No Recording', desc: '1 Technician on site, full AV setup' },
            'basic-recording': { name: 'Basic Recording', desc: 'Fixed camera or Zoom, post-event delivery' },
            'live-web-recording': { name: 'Live Web Recording', desc: 'Multi-camera, live streaming, 2 technicians' }
        };

        // Event info
        document.getElementById('review-event-name').textContent = document.getElementById('event-name').value;
        const spaceValue = document.querySelector('input[name="event-space"]:checked')?.value || '';
        document.getElementById('review-event-space').textContent = spaceMap[spaceValue] || spaceValue;
        document.getElementById('review-event-date').textContent = document.getElementById('event-date').value;
        document.getElementById('review-contact').textContent =
            `${document.getElementById('person-of-contact').value} (${document.getElementById('email-address').value})`;

        // Schedule
        document.getElementById('review-registration').textContent = formatTime(document.getElementById('registration-time').value);
        document.getElementById('review-start').textContent = formatTime(document.getElementById('event-start-time').value);
        document.getElementById('review-end').textContent = formatTime(document.getElementById('presentation-end-time').value);
        document.getElementById('review-shutdown').textContent = formatTime(document.getElementById('shutdown').value);

        // Recording
        const recordingValue = document.querySelector('input[name="recording-option"]:checked')?.value || '';
        const recording = recordingMap[recordingValue];
        if (recording) {
            document.getElementById('review-recording').innerHTML = `
                <strong>${recording.name}</strong>
                <p class="text-muted mb-0">${recording.desc}</p>
            `;
        }

        // Notes
        const notes = document.getElementById('other-notes').value;
        const notesSection = document.getElementById('review-notes-section');
        if (notes.trim()) {
            notesSection.style.display = 'block';
            document.getElementById('review-notes').textContent = notes;
        } else {
            notesSection.style.display = 'none';
        }
    }

    function formatTime(time24) {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateStep(currentStep)) return;

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);

            const response = await fetch('/api/submit', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Update modal with preview link if available (Ethereal test emails)
                const modalBody = document.querySelector('#success-modal .modal-body');
                if (result.previewUrl) {
                    modalBody.innerHTML = `
                        <div class="success-icon">✅</div>
                        <h3>Booking Submitted!</h3>
                        <p class="text-muted">Your test email was sent successfully.</p>
                        <a href="${result.previewUrl}" target="_blank" class="btn btn-primary mb-3">
                            View Email Preview
                        </a>
                        <p class="text-muted small">This link opens Ethereal's test inbox to view the email.</p>
                        <button type="button" class="btn btn-outline-secondary" onclick="location.reload()">Book Another Event</button>
                    `;
                }
                const modal = new bootstrap.Modal(document.getElementById('success-modal'));
                modal.show();
            } else {
                alert(result.message || 'Failed to submit booking. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit booking. Please check your connection and try again.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);

    // Initialize
    showStep(1);
});
