import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  // Validasi
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Semua field wajib diisi" });
  }

  // Simpan ke database cloud
  const { error } = await supabase
    .from("contact_messages")
    .insert([{ name, email, message }]);

  if (error) {
    return res.status(500).json({ message: "Gagal menyimpan data" });
  }

  // Kirim email notifikasi
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: "Pesan Baru dari Form Kontak",
      html: `
        <h3>Pesan Baru</h3>
        <p><b>Nama:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Pesan:</b><br>${message}</p>
      `
    });
  } catch (err) {
    return res.status(500).json({ message: "Gagal mengirim email" });
  }

  return res.status(200).json({ message: "Pesan berhasil dikirim!" });
}
