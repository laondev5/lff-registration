import nodemailer from 'nodemailer';

function getTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

export async function sendWelcomeEmail(to: string, name: string) {
    const transporter = getTransporter();

    const mailOptions = {
        from: `"GAC 2026 Registration" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: 'Registration Successful - GAC 2026',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #4F46E5; text-align: center;">Welcome to GAC 2026!</h1>
                <p>Dear <strong>${name}</strong>,</p>
                <p>Congratulations! Your registration for the <strong>Global Annual Conference 2026</strong> has been successfully received.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;">We are thrilled to have you join us for this life-transforming event. Get ready for an encounter that will change your life forever!</p>
                </div>

                <h3>Next Steps:</h3>
                <ul>
                    <li>If you booked accommodation, please ensure you upload your payment proof if you haven't already.</li>
                    <li>Join a department to serve in the workforce if you feel led.</li>
                    <li>Prepare your heart for what God is set to do.</li>
                </ul>

                <p style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Portal</a>
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Living Faith Foundation<br>
                    GAC 2026 Planning Committee
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${to}`);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

export async function sendRegistrationEmail(to: string, name: string, uniqueId: string, paymentRef: string) {
    const transporter = getTransporter();

    const mailOptions = {
        from: `"GAC 2026 Registration" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: `Registration Confirmed - GAC 2026 | ID: ${uniqueId}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #4F46E5; text-align: center;">Registration Confirmed! 🎉</h1>
                <p>Dear <strong>${name}</strong>,</p>
                <p>Your registration and payment for the <strong>Global Annual Conference 2026</strong> have been confirmed.</p>
                
                <div style="background-color: #4F46E5; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Your Registration ID</p>
                    <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${uniqueId}</p>
                </div>

                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                    <p style="margin: 0; color: #166534;"><strong>Payment Reference:</strong> ${paymentRef}</p>
                </div>

                <p>Please save your Registration ID. You may need it for:</p>
                <ul>
                    <li>Check-in at the event</li>
                    <li>Booking accommodation</li>
                    <li>Joining a department</li>
                </ul>

                <h3>What's Next?</h3>
                <ul>
                    <li>📍 Book accommodation if you need a place to stay</li>
                    <li>🙏 Join a department to serve during the conference</li>
                    <li>💡 Prepare your heart for what God is set to do</li>
                </ul>

                <p style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Visit Portal</a>
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Living Faith Foundation<br>
                    GAC 2026 Planning Committee
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Registration email with ID sent to ${to}`);
        return true;
    } catch (error) {
        console.error("Error sending registration email:", error);
        return false;
    }
}
