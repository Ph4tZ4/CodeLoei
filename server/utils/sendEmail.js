const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    // Note: User needs to provide EMAIL_USER and EMAIL_PASS in .env
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or configured host/port
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Define email options
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'CodeLoei <noreply@codeloei.com>',
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
