import { createHash, randomBytes } from "crypto";

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export function createPasswordResetToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  return {
    token,
    tokenHash,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://store.falintino.com";
}

export function getPasswordResetUrl(token: string) {
  return `${getPasswordResetBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "7 April Store <noreply@store.falintino.com>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum diatur.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset Kata Sandi 7 April Store",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Reset kata sandi 7 April Store</h2>
          <p>Halo ${escapeHtml(name)},</p>
          <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun kamu.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">
              Atur Ulang Kata Sandi
            </a>
          </p>
          <p>Link ini berlaku selama 30 menit dan hanya dapat digunakan satu kali.</p>
          <p>Kalau kamu tidak meminta reset password, abaikan email ini.</p>
          <p>7 April Store</p>
        </div>
      `,
      text:
        `Halo ${name},\n\nGunakan link berikut untuk mengatur ulang kata sandi akun 7 April Store:\n${resetUrl}\n\nLink berlaku 30 menit dan hanya dapat digunakan satu kali.\n\nJika kamu tidak meminta reset password, abaikan email ini.\n\n7 April Store`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gagal mengirim email reset password: ${body}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
