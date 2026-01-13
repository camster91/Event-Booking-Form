<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load environment variables from .env file
function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue; // Skip comments
        if (strpos($line, '=') === false) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!getenv($name)) {
            putenv("$name=$value");
        }
    }
    return true;
}

loadEnv(__DIR__ . '/.env');

$logFile = 'email_log.txt';



function logEntry($message) {
    global $logFile;
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - " . $message . "\n", FILE_APPEND);
}

function sanitize_input($data) {
    return htmlspecialchars(stripslashes(trim($data)));
}

function readAndLog($socket) {
    global $logFile;
    $response = fgets($socket, 512);
    logEntry("Received: $response");
    return $response;
}

function writeAndLog($socket, $message) {
    global $logFile;
    logEntry("Sending: $message");
    fwrite($socket, $message);
}

function smtp_mail($to, $subject, $message, $headers, $smtpDetails) {
    $socket = stream_socket_client("ssl://".$smtpDetails['host'].":".$smtpDetails['port'], $errno, $errstr, 30);
    if (!$socket) {
        logEntry("Failed to connect to SMTP server. Error: $errstr ($errno)");
        return false;
    }

    readAndLog($socket);
    writeAndLog($socket, "HELO localhost\r\n");
    readAndLog($socket);

    writeAndLog($socket, "AUTH LOGIN\r\n");
    readAndLog($socket);

    writeAndLog($socket, base64_encode($smtpDetails['username'])."\r\n");
    readAndLog($socket);

    writeAndLog($socket, base64_encode($smtpDetails['password'])."\r\n");
    readAndLog($socket);

    writeAndLog($socket, "MAIL FROM: <".$smtpDetails['username'].">\r\n");
    readAndLog($socket);

    writeAndLog($socket, "RCPT TO: <$to>\r\n");
    readAndLog($socket);

    writeAndLog($socket, "DATA\r\n");
    readAndLog($socket);

    $fullMessage = "Subject: $subject\r\n" . $headers . "\r\n" . $message;

    writeAndLog($socket, $fullMessage."\r\n.\r\n");
    readAndLog($socket);

    writeAndLog($socket, "QUIT\r\n");
    readAndLog($socket);

    fclose($socket);

    return true;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    logEntry("Processing POST request...");

    // Rest of the form fields
    $person_of_contact = sanitize_input($_POST['person-of-contact'] ?? '');
    $email_address = sanitize_input($_POST['email-address'] ?? '');
    $event_date = sanitize_input($_POST['event-date'] ?? '');
    $event_name = sanitize_input($_POST['event-name'] ?? '');
    $registration_time = sanitize_input($_POST['registration-time'] ?? '');
    $event_start_time = sanitize_input($_POST['event-start-time'] ?? '');
    $presentation_end_time = sanitize_input($_POST['presentation-end-time'] ?? '');
    $shutdown = sanitize_input($_POST['shutdown'] ?? '');
    $cc_number = sanitize_input($_POST['cc-number'] ?? '');
    $cfc_number = sanitize_input($_POST['cfc-number'] ?? '');
    $event_space = sanitize_input($_POST['event-space'] ?? '');
    $recording_option = sanitize_input($_POST['recording-option'] ?? '');
    $other_notes = sanitize_input($_POST['other-notes'] ?? '');

    $file_name = '';
    if(isset($_FILES['media-upload']) && $_FILES['media-upload']['error'] === UPLOAD_ERR_OK){
        $file_name = basename($_FILES['media-upload']['name']); // Sanitize filename
        $file_tmp = $_FILES['media-upload']['tmp_name'];
        $upload_dir = __DIR__ . '/uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        move_uploaded_file($file_tmp, $upload_dir . $file_name);
    }

    // Email body content
    $email_body = "<html><body style='font-family: Arial, sans-serif;'>";
    $email_body .= "<h1>Rotman AV Event Booking</h1>";
    $email_body .= "<h2>Event Name: " . $event_name . "</h2>";
    $email_body .= "<p><strong>Event Space:</strong> " . $event_space . "</p>";
    $email_body .= "<p><strong>Recording Option:</strong> " . $recording_option . "</p>";
    $email_body .= "<p><strong>Person Of Contact:</strong> " . $person_of_contact . "</p>";
    $email_body .= "<p><strong>Email Address:</strong> " . $email_address . "</p>";
    $email_body .= "<p><strong>Event Date:</strong> " . $event_date . "</p>";
    $email_body .= "<p><strong>Registration Time:</strong> " . $registration_time . "</p>";
    $email_body .= "<p><strong>Event Start Time:</strong> " . $event_start_time . "</p>";
    $email_body .= "<p><strong>Presentation End Time:</strong> " . $presentation_end_time . "</p>";
    $email_body .= "<p><strong>Shutdown:</strong> " . $shutdown . "</p>";
    $email_body .= "<p><strong>CC#:</strong> " . $cc_number . "</p>";
    $email_body .= "<p><strong>CFC#:</strong> " . $cfc_number . "</p>";
    $email_body .= "<p><strong>Other Notes:</strong> " . $other_notes . "</p>";
    if (!empty($file_name)) {
        $email_body .= "<p><strong>Uploaded File:</strong> <a href='http://rotmanav.online/uploads/" . $file_name . "'>View File</a></p>";
    }
    $email_body .= "</body></html>";

    $to = getenv('EMAIL_TO') ?: 'cameron.ashley@utoronto.ca';
    $subject = "New Event Request: " . $event_name;
    $smtp_username = getenv('SMTP_USERNAME') ?: 'requests@rotmanav.ca';
    $headers = "From: AV Booking Form<" . $smtp_username . ">\r\n";
    $headers .= "Reply-To: " . $email_address . "\r\n";
    $headers .= "To: " . $to . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=utf-8\r\n";

    $smtpDetails = [
        'host' => getenv('SMTP_HOST') ?: 'smtp.titan.email',
        'port' => getenv('SMTP_PORT') ?: 465,
        'username' => $smtp_username,
        'password' => getenv('SMTP_PASSWORD') ?: ''
    ];

    if (smtp_mail($to, $subject, $email_body, $headers, $smtpDetails)) {
        logEntry("Email sent successfully.");
        header("Location: thank_you.html");
        exit;
    } else {
        logEntry("Failed to send email.");
        echo "Failed to send email.";
    }
} else {
    echo "Form not submitted";
}


?>
