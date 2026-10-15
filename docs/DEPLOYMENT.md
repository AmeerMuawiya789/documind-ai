# Deployment (Vercel)

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "DocuMind AI initial build"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Never commit `.env`. `.gitignore` already excludes it.

## 2. Create the Vercel project

1. Import the repository in Vercel.
2. Framework preset: **Next.js**. No build-command changes needed
   (`npm run build`, output handled by Next).
3. Add **all** variables from `.env.example` in
   Project Settings → Environment Variables, with production values.
   Set `NEXT_PUBLIC_APP_URL` to your production domain
   (e.g. `https://documind-ai.vercel.app`).

## 3. Supabase production checklist

- Run both migrations on the production project.
- Auth → URL Configuration → add the production URL to **Redirect URLs**
  (needed for `/auth/callback` email links).
- Confirm the `documents` bucket is **private**.
- Enable backups: Database → Backups → point-in-time recovery (paid plans)
  or schedule `pg_dump` via the documented Supabase guidance.

## 4. Post-deploy smoke test

1. Sign up with a real email, verify, sign in.
2. Upload a small PDF → status should become `ready`.
3. Ask a question → cited answer appears.
4. Generate a summary → saved under Summaries.
5. Check `/app/usage` shows the operations counted.

## 5. Custom domain (optional)

Vercel → Settings → Domains → add your domain and follow the DNS
instructions. Update `NEXT_PUBLIC_APP_URL` and the Supabase redirect URLs.

## 6. Notes

- Upload processing is synchronous: keep `MAX_UPLOAD_MB` at 20 on
  serverless unless you move extraction to a background worker.
- Rate limiting is in-memory; a single Vercel region is fine for beta,
  add Redis (Upstash) before scaling out.
- Set up Stripe webhooks (`/api/billing/webhook`) per docs/PAYMENTS.md
  before advertising paid plans.
