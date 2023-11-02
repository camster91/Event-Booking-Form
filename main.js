$(document).ready(function() {
    $( "#event-date" ).datepicker();
    $('#registration-time, #event-start-time, #presentation-end-time, #shutdown').timepicker({
        'scrollDefault': '07:00'
    });
});

document.addEventListener("DOMContentLoaded", function() { 
    var dateInputs = document.querySelectorAll("input[type='date']");
    var timeInputs = document.querySelectorAll("input[type='time']");

    dateInputs.forEach(function(input) {
        input.addEventListener('keydown', function(e) {
            e.preventDefault();
        });
    });

    timeInputs.forEach(function(input) {
        input.addEventListener('keydown', function(e) {
            e.preventDefault();
        });
    });

    document.querySelector("form").addEventListener("submit", function(event) {
        let isValid = true;

        handleTimeInputs();
        isValid = validateRequiredFields();

        if (!isValid) {
            event.preventDefault();
            alert("Please fill out the highlighted fields.");
        }
    });
});

function handleTimeInputs() {
    var timeInputs = document.querySelectorAll("input[data-time]");
    timeInputs.forEach(function(timeInput) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/; // Improved time validation regex
        if (timeInput.value.match(timeRegex)) {
            timeInput.value += ':00';
        }
    });
}

function validateRequiredFields() {
    var requiredInputs = document.querySelectorAll("input.required");
    let isValid = true;

    requiredInputs.forEach(function(input) {
        input.classList.remove("error"); // Using class for error styling
        if (!input.value.trim()) {
            input.classList.add("error");
            isValid = false;
        }
    });

    return isValid;
}