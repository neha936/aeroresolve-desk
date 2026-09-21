# AeroResolve Desk ✈️🤖
> **Autonomous Airline Disruption Handling & AI Support Command Center**

AeroResolve Desk is a full-stack agentic platform designed to automate airline passenger support during flight delays and cancellations using a **3-column Command Center architecture**.

---

## 🌐 Live Application

* **Live Demo:** https://aeroresolve-desk.vercel.app

---

## ✨ Features

* **3-Column Command Center:** Real-time visibility into passenger context, decision paths, and tool execution traces.
* **LLM Policy Engine:** Powered by **Gemini 1.5 Flash** to evaluate airline disruption policies and recommend rebooking/refund paths.
* **Step-by-Step Tool Tracing:** Real-time logs tracking backend tool calls like `get_booking()`, `get_customer()`, and `evaluate_policy()`.
* **Supervisor Guardrails:** Built-in authority limits that trigger human supervisor reviews for complex exceptions or high fare waivers.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, Framer Motion
* **Backend:** Node.js, Express.js
* **AI Service:** Python, FastAPI, Google Gemini 1.5 Flash SDK
* **Database:** PostgreSQL (Neon)
* **Deployment:** Vercel (Frontend), Render (Backend & AI Service)

---
