<div align="center">

<img src="./assets/barboy.png" alt="BarBoy" width="120" />

# BarBoy — AI Chatbot Customer Service

**Asisten virtual untuk Burger Bangor Indonesia**

Chatbot AI yang menjawab pertanyaan pelanggan seputar menu, promo, lokasi outlet,
kemitraan, dan layanan — dengan jawaban *streaming* real-time dan data yang selalu
sinkron dengan sistem bisnis.

![status](https://img.shields.io/badge/status-production-success)
![type](https://img.shields.io/badge/type-AI%20Chatbot-blueviolet)
![stack](https://img.shields.io/badge/Next.js-15-black)
![license](https://img.shields.io/badge/license-Proprietary-red)

</div>

---

## 📌 Tentang Project

**BarBoy** adalah chatbot customer service berbasis AI yang dikembangkan untuk
**Burger Bangor Indonesia** (800+ outlet, 150+ kota). Bot ini disematkan langsung
di website utama dan melayani pelanggan 24/7 — menjawab pertanyaan dalam Bahasa
Indonesia dengan persona ramah, sambil menarik informasi menu/promo/outlet secara
*live* dari sistem internal perusahaan.

> 🔒 **Repo ini adalah etalase (showcase).** Source code bersifat *proprietary* dan
> Yang ditampilkan hanya gambaran umum produk.

---

## ✨ Fitur Utama

- 💬 **Chat streaming real-time** — jawaban muncul kata-per-kata, bukan loading lama.
- 🍔 **Data menu, promo, & outlet live** — selalu sinkron dengan sistem bisnis, tanpa update manual.
- 📍 **Outlet terdekat berbasis lokasi** — menemukan gerai terdekat dari posisi pengguna.
- 🎴 **Rich cards** — tampilan visual untuk menu, promo, dan daftar outlet.
- 🧠 **Routing model cerdas** — pertanyaan ringan & berat ditangani berbeda untuk efisiensi.
- 🔤 **Toleransi salah ketik** — tetap paham walau ada typo.
- ⚡ **Hemat & tahan beban** — caching + failover otomatis menjaga bot selalu aktif.
- 🛡️ **Aman** — rate limiting, deteksi penyalahgunaan, dan proteksi input.

---

## 🏗️ Gambaran Arsitektur

```
Pengguna  ─▶  Website Burger Bangor  ─▶  BarBoy (embed)
                                            │
                                            ▼
                              ┌────────────────────────────┐
                              │  Lapisan efisiensi & aman   │
                              │  (cache, rate limit, filter)│
                              └────────────────────────────┘
                                            │
                                            ▼
                        Penarikan data bisnis live  +  LLM (streaming)
                                            │
                                            ▼
                              Jawaban + rich cards real-time
```

---

## 🧰 Tech Stack

| Kategori | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| AI / Streaming | Vercel AI SDK (Server-Sent Events) |
| Model | LLM keluarga LLaMA 3.x via penyedia berkecepatan tinggi |
| UI | Tailwind CSS, Motion, Markdown rendering |
| Validasi | Zod |
| Testing | Vitest |
| Deploy | Docker, di belakang Nginx (reverse proxy) |

---

<div align="center">
<sub>© Burger Bangor Indonesia. Preview : <a href="https://chat.burgerbangorindonesia.com/">https://chat.burgerbangorindonesia.com/</a></sub>
</div>
