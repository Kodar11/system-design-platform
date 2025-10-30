// src/lib/email/transporter.ts
import nodemailer from "nodemailer";

// Create a singleton transporter with connection pooling
let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      secure: process.env.EMAIL_SERVER_PORT === "465",
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max concurrent connections
      maxMessages: 100, // Max messages per connection
      rateDelta: 1000, // 1 second between messages
      rateLimit: 5, // Max 5 messages per rateDelta
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Handle errors
    transporter.on('error', (error) => {
      console.error('Email transporter error:', error);
    });

    // Log when connection pool is idle
    transporter.on('idle', () => {
      console.log('Email transporter is idle and ready');
    });
  }

  return transporter;
}

// Optional: Close transporter on app shutdown
export function closeEmailTransporter(): void {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}
