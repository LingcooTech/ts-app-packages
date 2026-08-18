import { describe, expect, it, vi } from "vitest";
import { createSmtpMailer } from "./index.js";

const sendMail = vi.fn().mockResolvedValue({ messageId: "test-message" });

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
  },
}));

describe("mailer", () => {
  it("creates an SMTP mailer without embedding application settings", async () => {
    const mailer = createSmtpMailer({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      user: "user@example.com",
      password: "secret",
      from: "noreply@example.com",
    });

    await mailer.send({
      to: "person@example.com",
      subject: "Hello",
      text: "Hello",
    });
    expect(sendMail).toHaveBeenCalledWith({
      to: "person@example.com",
      subject: "Hello",
      text: "Hello",
      from: "noreply@example.com",
    });
  });
});
