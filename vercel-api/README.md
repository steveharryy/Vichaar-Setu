# Vichaar Setu API (Vercel + Neon)

This is the backend API for Vichaar Setu. It connects to your Neon PostgreSQL database.

## Setup

1. **Install dependencies:**
   ```bash
   cd vercel-api
   npm install
   ```

2. **Create a Vercel project:**
   ```bash
   npx vercel
   ```

3. **Add your Neon DATABASE_URL:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `DATABASE_URL` = your Neon connection string

4. **Deploy:**
   ```bash
   npx vercel --prod
   ```

5. **Get your API URL:**
   After deployment, you'll get a URL like: `https://your-project.vercel.app`

6. **Update frontend:**
   Set `VITE_API_URL=https://your-project.vercel.app` in your Lovable project secrets

## Initialize Database

After deploying, initialize the database tables by running:

```bash
curl -X POST https://your-project.vercel.app/api/db \
  -H "Content-Type: application/json" \
  -d '{"action": "initDatabase", "data": {}}'
```

## API Endpoints

All requests go to `POST /api/db` with body:
```json
{
  "action": "actionName",
  "data": { ...params }
}
```

### Available Actions:
- `createUser` - Create/update user
- `getUser` - Get user by clerk_id
- `getUserRole` - Get user role
- `updateUserProfile` - Update profile
- `createProject` - Create project
- `getProjectsByOwner` - Get user's projects
- `getAllPublishedProjects` - Get all published projects
- `updateProject` - Update project
- `deleteProject` - Delete project
- `sendContactRequest` - Send contact request
- `getContactRequestsForUser` - Get incoming requests
- `getSentContactRequests` - Get sent requests
- `updateContactRequestStatus` - Accept/decline request
- `initDatabase` - Create tables
