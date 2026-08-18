import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export type MailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type Mailer = {
  send(message: MailMessage): Promise<void>;
};

export type SmtpMailerConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
};

export function createSmtpMailer(config: SmtpMailerConfig): Mailer {
  const transport: Transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });

  return {
    async send(message) {
      await transport.sendMail({ ...message, from: config.from });
    },
  };
}
