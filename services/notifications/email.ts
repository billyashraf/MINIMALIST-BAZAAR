interface ShippingEmailPayload {
  to: string;
  customerName: string;
  orderId: string;
  items: { title: string; quantity: number }[];
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
}

export async function sendShippingEmail(payload: ShippingEmailPayload): Promise<void> {
  const isConfigured =
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS;

  if (!isConfigured) {
    console.log("[Email] Shipping notification (email not configured):", {
      to: payload.to,
      subject: `Your order has shipped — ${payload.carrier} ${payload.trackingNumber}`,
      items: payload.items.map((i) => `${i.title} × ${i.quantity}`),
      tracking: payload.trackingUrl ?? payload.trackingNumber,
    });
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const itemList = payload.items
    .map((i) => `<li>${i.title} × ${i.quantity}</li>`)
    .join("");

  const trackingLink = payload.trackingUrl
    ? `<a href="${payload.trackingUrl}" style="color:#000;font-weight:600;">Track your package →</a>`
    : `<strong>${payload.carrier} ${payload.trackingNumber}</strong>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? `Minimalist Bazaar <${process.env.EMAIL_USER}>`,
    to: payload.to,
    subject: "Your order has shipped!",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#171717">
        <h2 style="font-size:20px;font-weight:700;margin-bottom:4px">Your order is on its way</h2>
        <p style="color:#6b7280;margin-top:0">Hi ${payload.customerName}, great news — your order has shipped.</p>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280">Carrier: <strong style="color:#111">${payload.carrier}</strong></p>
          <p style="margin:0 0 12px 0;font-size:14px;color:#6b7280">Tracking: <strong style="color:#111">${payload.trackingNumber}</strong></p>
          ${trackingLink}
        </div>

        <p style="font-size:14px;font-weight:600;margin-bottom:8px">Items shipped:</p>
        <ul style="font-size:14px;color:#374151;padding-left:20px">${itemList}</ul>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="font-size:12px;color:#9ca3af">Minimalist Bazaar · Questions? Reply to this email.</p>
      </div>
    `,
  });
}
