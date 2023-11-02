<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

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
    $other_notes = $_POST['other-notes'];

    if(isset($_FILES['media-upload'])){
        $file_name = $_FILES['media-upload']['name'];
        $file_tmp =$_FILES['media-upload']['tmp_name'];
        move_uploaded_file($file_tmp,"uploads/".$file_name);
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
    $email_body .= "<p><strong>Uploaded File:</strong> <a href='http://rotmanav.online/uploads/" . $file_name . "'>View File</a></p>";
    $email_body .= "</body></html>";

    $to = 'cameron.ashley@utoronto.ca';
    $subject = "New Event Request: " . $event_name;
    $headers = "From: AV Booking Form<request@rotmanav.online>\r\n";
    $headers .= "Reply-To: " . $email_address . "\r\n";
    $headers .= "To: " . $to . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=utf-8\r\n";

    $smtpDetails = [
        'host' => 'smtp.titan.email',
        'port' => 465,
        'username' => 'request@rotmanav.online',
        'password' => 'xXSZ$qC(&nn7qR2' // Please note: Password should not be hardcoded like this for security reasons.
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
