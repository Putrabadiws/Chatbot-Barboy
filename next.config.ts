import type { NextConfig } from "next";

// Hanya web utama Burger Bangor yang boleh nge-iframe chatbot ini.
// frame-ancestors (bukan X-Frame-Options) — XFO lama cuma dukung SATU origin,
// sedangkan kita butuh apex + www. CSP frame-ancestors mendukung banyak origin
// sekaligus dan jadi standar anti-clickjacking modern.
const CSP_FRAME_ANCESTORS =
  "frame-ancestors 'self' https://burgerbangorindonesia.com https://www.burgerbangorindonesia.com";

const nextConfig: NextConfig = {
  // standalone: build menghasilkan server.js + hanya deps terpakai → image Docker
  // kecil. Dipakai untuk container di VPS (lihat Dockerfile).
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP_FRAME_ANCESTORS },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
