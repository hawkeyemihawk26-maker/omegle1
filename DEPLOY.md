# Deployment Guide

This application uses **Supabase** for the backend (database and real-time messaging). This means you do NOT need to deploy a separate Node.js server. You only need to deploy the frontend.

## Step 1: Set up Supabase (The "Brain")

1.  Go to [Supabase.com](https://supabase.com) and create a new project.
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy the contents of `supabase_schema.sql` from this project and paste it into the SQL Editor.
4.  Click **Run** to create the necessary tables and policies.
5.  Go to **Project Settings** (the gear icon at the bottom of the left sidebar) -> **API** (under the Configuration section).
6.  Copy your **Project URL** and the **anon / public** Key.

## Step 2: Configure the Frontend

1.  Create a `.env` file in the root of your project (if running locally) or set these environment variables in your deployment platform (Vercel/Netlify):
    ```
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_KEY=your_anon_key
    ```

## Step 3: Deploy the Frontend (The "Face")

You can deploy the frontend to any static hosting service like Vercel, Netlify, or Firebase Hosting.

### Option A: Deploy to Vercel (Recommended)

1.  Push your code to GitHub.
2.  Go to [Vercel.com](https://vercel.com) and import your repository.
3.  Vercel will automatically detect that it's a Vite project.
4.  Add the Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY`) in the Vercel dashboard.
5.  Click **Deploy**.

### Option B: Deploy to Netlify

1.  Push your code to GitHub.
2.  Go to [Netlify.com](https://netlify.com) and import your repository.
3.  Build command: `npm run build`
4.  Publish directory: `dist`
5.  Add the Environment Variables in "Site settings" -> "Build & deploy" -> "Environment".
6.  Click **Deploy**.

---

## Summary
*   **Frontend:** Hosted on Vercel/Netlify.
*   **Backend:** Managed by Supabase (Serverless).

Enjoy your Omegle Clone!