Subject: Task Assignment

Hi [Candidate Name],

## About the Project

It's a Project Management web application built with Next.js, MongoDB, and TailwindCSS. The app has three types of users:

- **Admin** — manages team members and tasks, can bulk import tasks from Excel, and views overall stats.
- **Developer** — logs in to a personal portal, sees only their assigned tasks, and can create new tasks with image attachments.
- **Public visitor** — can view the dashboard in read-only mode.

Authentication uses JWT stored in an httpOnly cookie. Images (avatars and task attachments) are uploaded to Cloudinary. Data is stored in MongoDB via Mongoose. The app uses the Next.js App Router, with all frontend pages and backend API routes living in a single codebase.

A complete walkthrough of the architecture, data models, and API endpoints is available in `PROJECT-DOCUMENTATION.md` at the repo root — please read that first.

## Instructions

1. Clone the repo from https://github.com/mnt-future2020/lobbi-ProjMngnt.git
2. Remove the existing `.git` folder and re-initialize it under your own GitHub account (push to a new **private** repo).
3. Set up your own MongoDB Atlas and Cloudinary accounts (both free tiers) and configure the environment variables in a local `.env.local` file. Required keys: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
4. Run the app locally and explore it fully before you start coding.

## What's Expected

1. **Understand the existing codebase** — how authentication works, how tasks and developers are managed, how the Excel import works, and how uploads flow through Cloudinary. Write your understanding in a short `WALKTHROUGH.md`.

2. **Extend the app to support multiple projects.** Today the app manages tasks and developers in one global pool. Your main task is to introduce a **Project** entity so that:
   - Each task belongs to a project.
   - A developer can be part of one or more projects.
   - The admin can create, view, edit, and archive projects.
   - The admin dashboard can switch between projects and filter everything by the selected project.
   - Developers in the portal see only tasks from their assigned projects.

3. **Secure the API.** The existing API routes don't enforce authentication — only the frontend redirects unauthenticated users. Add proper auth checks on the backend so developers can't modify tasks they don't own, and only admins can perform admin-only operations.

4. **Bonus (optional):** move the hardcoded admin credentials out of the code into env vars, add a `.env.example` file, and fix the unsanitized regex input in search queries.

## Deliverables

- Link to your private GitHub repo.
- `WALKTHROUGH.md` explaining your understanding of the existing code.
- `CHANGES.md` listing what you added or changed.
- A short screen recording (5–10 min) walking through the new multi-project feature.

## Timeline

5 working days, with a mid-point check-in on day 3.

Ask questions early if anything is unclear — don't guess.

Best,
Udhay
udhay@mntfuture.com
