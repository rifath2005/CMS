import * as nodemailer from 'nodemailer';

/**
 * Email Service for sending OTPs and notifications
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Send OTP email for password reset
   */
  async sendOTP(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'NotinQ <noreply@notinq.com>',
      to: email,
      subject: 'Password Reset OTP - NotinQ',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff7a00 0%, #e66e00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 3px solid #ff7a00; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp { font-size: 36px; font-weight: bold; color: #001533; letter-spacing: 8px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Password Reset Request</h1>
              <p style="margin: 10px 0 0 0;">NotinQ Canteen Management System</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password. Use the One-Time Password (OTP) below to proceed:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your OTP</p>
                <div class="otp">${otp}</div>
                <p style="margin: 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This OTP will expire in 10 minutes</li>
                  <li>Do not share this OTP with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>

              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br><strong>NotinQ Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 NotinQ - Zero Queue Canteen Management</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request - NotinQ

You requested to reset your password.

Your OTP: ${otp}

This OTP will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
NotinQ Team
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✓ OTP email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email. Please try again later.');
    }
  }

  /**
   * Verify email service configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✓ Email service is ready');
      return true;
    } catch (error) {
      console.error('✗ Email service configuration error:', error);
      return false;
    }
  }
}
