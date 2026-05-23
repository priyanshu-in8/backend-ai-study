import nodemailer from 'nodemailer';

let transporter;

// Initialize email transporter based on environment
const initializeTransporter = async () => {
  if (transporter) return transporter;

  const env = (process.env.EMAIL_SERVICE || 'brevo').toLowerCase();
  let transportConfig;

  if (env === 'mailtrap') {
    transportConfig = {
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
      secure: false,
    };
  } else if (env === 'gmail') {
    transportConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: false,
    };
  } else if (env === 'brevo') {
    transportConfig = {
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    };
  } else {
    throw new Error('Invalid EMAIL_SERVICE configuration');
  }

  transporter = nodemailer.createTransport(transportConfig);

  try {
    await transporter.verify();
    console.log(`Email transporter verified for service: ${env}`);
  } catch (verifyError) {
    console.error('Email transporter verification failed:', verifyError);
    transporter = null;
    throw verifyError;
  }

  return transporter;
};

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {string} clientUrl - Client base URL for verification link
 */
export const sendVerificationEmail = async (email, token, clientUrl = 'http://localhost:3000') => {
  try {
    const transporter = await initializeTransporter();

    const verificationLink = `${clientUrl}/verify-email?token=${token}`;
    const fromEmail = process.env.SENDER_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: 'Verify Your Email - AI Study Navigator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to AI Study Navigator!</h2>
          <p>Thank you for registering. Please verify your email address to complete your signup process.</p>

          <div style="margin: 30px 0;">
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>

          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #007bff;">
            ${verificationLink}
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This link will expire in 15 minutes.
          </p>

          <p style="color: #666; font-size: 12px;">
            If you didn't request this email, please ignore it.
          </p>
        </div>
      `,
      text: `
        Welcome to AI Study Navigator!

        Please verify your email address to complete your signup process.

        Click this link to verify: ${verificationLink}

        This link will expire in 15 minutes.

        If you didn't request this email, please ignore it.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send welcome email after verification
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 */
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = await initializeTransporter();
    const fromEmail = process.env.SENDER_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: 'Welcome to AI Study Navigator!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome, ${userName}!</h2>
          <p>Your email has been verified successfully. You can now login and start using AI Study Navigator.</p>

          <div style="margin: 30px 0; padding: 20px; background-color: #f0f0f0; border-radius: 5px;">
            <h3>Features You Can Access:</h3>
            <ul>
              <li>AI-powered study materials</li>
              <li>Quiz generation</li>
              <li>Text summarization</li>
              <li>Flashcard creation</li>
              <li>Chat with AI for learning</li>
            </ul>
          </div>

          <p>Happy learning!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    throw new Error('Failed to send welcome email');
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} clientUrl - Client base URL
 */
export const sendPasswordResetEmail = async (email, resetToken, clientUrl = 'http://localhost:3000') => {
  try {
    const transporter = await initializeTransporter();
    const fromEmail = process.env.SENDER_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;

    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: 'Password Reset - AI Study Navigator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password.</p>

          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This link will expire in 15 minutes.
          </p>

          <p style="color: #666; font-size: 12px;">
            If you didn't request this email, please ignore it.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error.message);
    throw new Error('Failed to send password reset email');
  }
};
