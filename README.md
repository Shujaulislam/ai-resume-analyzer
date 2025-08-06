# Resumind: AI Resume Analyzer 🚀

A modern, full-stack, AI-powered **Resume Analyzer** app built with React, TypeScript, React Router, Zustand, and TailwindCSS.
Upload your resume (PDF), get actionable **ATS scores** & AI feedback, and manage your files—all using Puter.js APIs for secure authentication, storage, and full LLM-powered analysis.

---

## ✨ Features

* **AI Resume Analysis** — Upload your PDF resume for instant feedback and suggestions using large language models (via Puter.js).
* **ATS Scoring** — Simulates Applicant Tracking Systems and gives an ATS compatibility score.
* **Detailed Feedback Dashboard** — Breakdowns across content, structure, skills, tone & style.
* **User Authentication** — Secure, OAuth-powered single sign-in/out via Puter.js.
* **Persistent Cloud Storage** — All resumes, previews, and feedback are saved to Puter’s file system and key-value store.
* **PDF to Image Preview** — See your uploaded resume rendered as an image preview.
* **SSR + SPA** — React Router, Vite, and SSR for fast performance and SEO.
* **Self-Serve Data Wipe** — View all your cloud-stored resume assets and wipe your data at any time.
* **Dockerized** — For one-command production and cloud deployments.
* **Beautiful UI** — Clean Tailwind design, with responsive layout and modern UI components.

---

## 🛠️ Getting Started

### Prerequisites

* **Node.js v20+**
* **npm** (or yarn/pnpm)
* A [Puter.js](https://puter.com/) account for authentication, storage, and AI features

---

### Development

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Production Build

```bash
npm run build
npm run start
```

---

### Docker Deployment

```bash
docker build -t resumind .
docker run -p 3000:3000 resumind
```

Then open [http://localhost:3000](http://localhost:3000)

---

## 📂 Directory Overview

```
ai-resume-analyzer/
├── README.md
├── Dockerfile
├── package.json
├── vite.config.ts
├── app/
│   ├── app.css             # Tailwind + custom styles
│   ├── root.tsx            # App root & layout
│   ├── routes.ts           # Route configuration
│   ├── components/         # UI components (Navbar, Uploader, ATS, Details, etc.)
│   ├── lib/                # Utilities, Puter hooks, PDF/image logic
│   └── routes/             # App page routes (home, upload, resume, wipe, auth)
├── constants/              # AI prompt formats and example data
├── types/                  # Shared TypeScript types
```

---

## 🚦 How It Works (User Flow)

1. **Sign In** — Authenticate securely via Puter.js OAuth.
2. **Upload Resume** — Drag-and-drop PDF (max 20MB), optionally enter job info.
3. **Preview** — Converts first page to an image preview.
4. **AI Feedback** — Resume analyzed by GPT-4.1-nano model using recruiter-tuned prompts.
5. **Dashboard** — All scores and improvement tips shown in a structured, visual format.
6. **Data Management** — Delete individual files or wipe all data from your cloud account.

---

## 🤖 AI Feedback Structure

```ts
interface Feedback {
  overallScore: number;
  ATS: {
    score: number;
    tips: { type: "good" | "improve"; tip: string }[];
  };
  toneAndStyle: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
  content: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
  structure: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
  skills: {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string }[];
  };
}
```

---

## 🖼️ Screenshots

<!-- Add screenshots for upload flow, ATS scoring, feedback dashboard, and data wipe UI -->

---

## 📝 Customization & Extensibility

* **Styling** — Built with TailwindCSS; fully customizable.
* **Model** — Uses Puter.js LLMs; can be replaced with fine-tuned or advanced models.
* **Cloud Logic** — Swap out `app/lib/puter.ts` to integrate your own backend.
* **Deployment** — Dockerfile supports production-ready, multi-stage builds.

---

## ❓ FAQ

**Q: Is this app only for Puter.js users?**
A: Yes, it relies on Puter.js for authentication, cloud storage, and AI functionality. You can modify it to use your own APIs.

**Q: What file size is supported?**
A: Each uploaded PDF can be up to 20MB.

**Q: Is my data secure?**
A: Yes. All resumes and analysis are stored privately in your Puter.js cloud environment and can be deleted at any time.

---

## 🙏 Credits

* Built with [React Router](https://reactrouter.com/), [Vite](https://vitejs.dev/), [TailwindCSS](https://tailwindcss.com/), and [Puter.js](https://puter.com/)
* Inspired by real-world recruiter feedback and job seeker needs

---

## 📄 License

[MIT](./LICENSE)

---
