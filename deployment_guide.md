# Deployment Guide: Red Alert App (Full Stack)

This guide walks you through the finalized deployment of your Red Alert system.

## 1. Supabase & Backend (Edge Functions)
You have already started this. Ensure the `poll-oref` function is deployed.
1. **Deploy**: `npx supabase functions deploy poll-oref`
2. **Secrets**: Set the following in Supabase dashboard or via CLI:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (for database access)

## 2. Web App (Lovable / Vite)
1. **Repository**: Ensure your code is pushed to GitHub.
2. **Lovable Settings**: In [Lovable.dev](https://lovable.dev), ensure your project is connected.
3. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 3. Custom Domain Setup (Current Step)
To connect your own domain (e.g., `redalert-israel.com`):
1. **Lovable / Vercel Settings**: Go to the **Domains** tab in your hosting provider's dashboard.
2. **Add Domain**: Type your domain name.
3. **DNS Records**: You will be given a set of records (A or CNAME).
4. **Registrar**: Log in to your domain registrar (e.g., GoDaddy, Namecheap) and add those records.
5. **SSL**: Once records propagate, SSL (HTTPS) will be automatically generated.

## 4. iOS App Deployment (Next Step)
To get the app on your physical iPhone via TestFlight:
1. **Apple Developer Account**: You need an active membership ($99/year).
2. **EAS Build**:
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`
   - Configure: `eas build:configure`
3. **Build for Store**: Run `eas build --platform ios`. 
   - Choose "App Store" or "Internal" distribution.
4. **Transporter / TestFlight**: Once the build finishes, it will be uploaded to App Store Connect. You can then invite yourself as an internal tester.

## 5. The "Heartbeat" (Production Poller)
Since Supabase Edge Functions wait for triggers, you need a "heartbeat" to poll Oref every 2 seconds:
- **Option A (Persistent)**: Run `npx tsx scripts/heartbeat.ts` on a small VPS or a home server.
- **Option B (GitHub Actions)**: Set up a recurring action to hit your Edge Function (less precise than 2 seconds).

> [!IMPORTANT]
> Always verify that your `VITE_SUPABASE_URL` points to your PROD instance, not a local dev environment.
