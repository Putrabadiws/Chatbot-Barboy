<div align="center">
<img src="./assets/barboy.png" alt="BarBoy" width="120" />

# BarBoy — AI Chatbot Customer Service

**Virtual assistant for Burger Bangor Indonesia**

An AI chatbot that answers customer questions about the menu, promos, store locations,
partnerships, and services — with real-time *streaming* responses and data always
in sync with business systems.

![status](https://img.shields.io/badge/status-production-success)
![type](https://img.shields.io/badge/type-AI%20Chatbot-blueviolet)
![stack](https://img.shields.io/badge/Next.js-15-black)
![license](https://img.shields.io/badge/license-Proprietary-red)
</div>

---

## 📌 About

**BarBoy** is an AI-powered customer service chatbot built for
**Burger Bangor Indonesia** (800+ outlets, 150+ cities). Embedded directly
on the main website, it serves customers 24/7 — answering questions in
Indonesian with a friendly persona, while pulling live menu/promo/outlet
information from the company's internal systems.

> 🔒 **This repo is a showcase.** The source code is *proprietary* —
> only a general overview of the product is displayed here.

---

## ✨ Key Features

- 💬 **Real-time streaming chat** — responses appear word by word, no long loading.
- 🍔 **Live menu, promo, & outlet data** — always in sync with business systems, no manual updates.
- 📍 **Location-based nearest outlet** — finds the closest store from the user's position.
- 🎴 **Rich cards** — visual display for menus, promos, and outlet listings.
- 🧠 **Smart model routing** — light and heavy queries are handled differently for efficiency.
- 🔤 **Typo tolerance** — understands queries even with typos.
- ⚡ **Efficient & resilient** — caching + automatic failover keeps the bot always active.
- 🛡️ **Secure** — rate limiting, abuse detection, and input protection.

---

## 🏗️ Architecture Overview

```
User  ─▶  Burger Bangor Website  ─▶  BarBoy (embed)
                                          │
                                          ▼
                            ┌────────────────────────────┐
                            │   Efficiency & safety layer  │
                            │  (cache, rate limit, filter) │
                            └────────────────────────────┘
                                          │
                                          ▼
                      Live business data fetch  +  LLM (streaming)
                                          │
                                          ▼
                            Response + real-time rich cards
```

---

## 🧰 Tech Stack

| Category       | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Framework      | Next.js 15 (App Router), React 19, TypeScript           |
| AI / Streaming | Vercel AI SDK (Server-Sent Events)                      |
| Model          | LLaMA 3.x family LLM via high-speed provider            |
| UI             | Tailwind CSS, Motion, Markdown rendering                |
| Validation     | Zod                                                     |
| Testing        | Vitest                                                  |
| Deploy         | Docker, behind Nginx (reverse proxy)                    |

---

<div align="center">
<sub>© Burger Bangor Indonesia. Preview : <a href="https://chat.burgerbangorindonesia.com/">https://chat.burgerbangorindonesia.com/</a></sub>
</div>
