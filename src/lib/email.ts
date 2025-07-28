import nodemailer from 'nodemailer';

// Create transporter for Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTPEmailTemplate(otp: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Next</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">Next</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0; font-size: 24px;">Email Verification</h2>
          <p style="margin: 0; opacity: 0.9;">Welcome to Next, ${name}!</p>
        </div>
        
        <div style="padding: 20px 0; text-align: center;">
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            Thank you for registering with Next. To complete your registration, please verify your email address by entering the verification code below:
          </p>
          
          <div style="background-color: #f8f9fa; border: 2px dashed #e9ecef; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 4px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            This code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This email was sent from Next. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
