import nodemailer from 'nodemailer';

/**
 * Interface for email configuration
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  debug?: boolean;
}

/**
 * Interface for email message
 */
export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  cc?: string;
  bcc?: string;
}

/**
 * Email service for sending emails via SMTP
 */
export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private debug: boolean;

  /**
   * Create a new EmailService instance
   * @param config SMTP configuration
   */
  constructor(config: EmailConfig) {
    this.debug = config.debug || false;
    
    if (this.debug) {
      console.error('[Setup] Initializing email service...');
    }
    
    this.fromEmail = config.auth.user;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  /**
   * Send an email
   * @param message Email message to send
   * @returns Promise resolving to the send result
   */
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; info: any }> {
    if (this.debug) {
      console.error(`[Email] Sending email to: ${message.to}`);
    }
    
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        text: !message.isHtml ? message.body : undefined,
        html: message.isHtml ? message.body : undefined,
      });
      
      if (this.debug) {
        console.error(`[Email] Email sent successfully: ${info.messageId}`);
      }
      return { success: true, info };
    } catch (error) {
      console.error(`[Error] Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Verify SMTP connection
   * @returns Promise resolving to true if connection is successful
   */
  async verifyConnection(): Promise<boolean> {
    if (this.debug) {
      console.error('[Setup] Verifying SMTP connection...');
    }
    
    try {
      await this.transporter.verify();
      if (this.debug) {
        console.error('[Setup] SMTP connection verified successfully');
      }
      return true;
    } catch (error) {
      console.error(`[Error] SMTP connection verification failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
