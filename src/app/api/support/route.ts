import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const supportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(100),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = supportSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = result.data;

    // Save to database
    const ticket = await prisma.supportTicket.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'pending',
      },
    });

    const supportEmail = process.env.SUPPORT_EMAIL;

    if (!supportEmail) {
      return NextResponse.json(
        { success: false, error: 'Support email not configured' },
        { status: 500 }
      );
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Support Request - ${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 28px;">Gram Kushal Support</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">New Support Request</h2>
            <p style="margin: 0; opacity: 0.9;">From: ${name}</p>
          </div>
          
          <div style="padding: 20px 0;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Contact Information</h3>
              <p style="color: #555; margin: 8px 0;"><strong>Name:</strong> ${name}</p>
              <p style="color: #555; margin: 8px 0;"><strong>Email:</strong> ${email}</p>
              <p style="color: #555; margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">Message</h3>
              <p style="color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This email was sent from the Gram Kushal Help & Support page.<br>
              To reply to this user, send an email to: <a href="mailto:${email}" style="color: #16a34a;">${email}</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResult = await sendEmail({
      to: supportEmail,
      subject: `Support Request: ${subject}`,
      html: emailHtml,
      text: `Support Request from ${name}\n\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    if (!emailResult.success) {
      // Still return success since we saved to DB
      console.error('Failed to send email notification:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Support request sent successfully',
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
