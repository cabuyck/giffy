# Giffy Deployment Guide

## Quick Deploy to Render (Recommended - Free Tier)

Render is the easiest option for deploying this Socket.io app:

### Prerequisites
- GitHub account with your code pushed
- Giphy API key from [developers.giphy.com](https://developers.giphy.com)

### Steps

1. **Push your code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "feat: Add deployment configuration"
   git push origin ralph/giffy-mvp-game
   ```

2. **Create Render account** at [render.com](https://render.com)

3. **Create new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration

4. **Add your Giphy API Key**:
   - In your service settings, add environment variable:
     - Key: `GIPHY_API_KEY`
     - Value: Your Giphy API key
     - **Important**: Set "sync: false" (don't sync to repo)
   - Click "Save Changes"

5. **Deploy!** Click "Create Web Service"

Your app will be live at: `https://giffy.onrender.com` (or your chosen service name)

### What Render Does
- Runs `npm install && cd client && npm run build` (builds client)
- Starts with `npx tsx server/index.ts` (runs server)
- Serves static files from `client/dist/`
- Automatically restarts on crashes
- Free tier includes: 512MB RAM, 0.1 CPU (always on)

---

## Local Testing (Production Mode)

To test locally as if it were production:

1. **Build the client**:
   ```bash
   npm run build:client
   ```

2. **Set environment variables**:
   ```bash
   export NODE_ENV=production
   export GIPHY_API_KEY=your_key_here
   ```

3. **Start the server**:
   ```bash
   npx tsx server/index.ts
   ```

The app will run on http://localhost:3001 (serves both client and server from same port).

---

## Manual Deployment to Any Node.js Hosting

For Railway, Fly.io, or your own server:

### 1. Build locally first
```bash
# Build client to static files
npm run build:client
```

### 2. Deploy server directory
Upload/run the `server` directory with:
- `NODE_ENV=production`
- `GIPHY_API_KEY=your_key_here`
- Run: `npx tsx server/index.ts`

The server will:
- Serve static files from `../client/dist`
- Handle Socket.io connections
- Proxy Giphy API requests

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GIPHY_API_KEY` | **Yes** | *(none)* | Get from [developers.giphy.com](https://developers.giphy.com) |
| `NODE_ENV` | No | *(development)* | Set to `production` for production builds |
| `PORT` | No | `3001` | Server port |
| `CLIENT_URL` | No | `http://localhost:5173` | Only for dev mode CORS; **omit in production** |

---

## Architecture Notes

### Development
- **Client**: Vite dev server on port 5173
- **Server**: Express + Socket.io on port 3001
- **CORS**: Server allows requests from `http://localhost:5173`

### Production
- **Single service**: Express serves everything
- **Static files**: `client/dist/` served at root
- **API routes**: `/api/*` handled by Express
- **Socket.io**: Same-origin, no CORS needed
- **Fallback**: All non-API routes return `client/dist/index.html`

---

## Troubleshooting

### "Giphy API key is not configured"
- Make sure `GIPHY_API_KEY` environment variable is set
- Don't commit `.env` file (it's in `.gitignore`)

### "Socket.io connection fails"
- Check that `CLIENT_URL` is NOT set in production
- In production, socket uses relative URL (same-origin)

### Build errors
- Delete `node_modules` and run `npm install`
- Make sure Node.js version is 20+: `node --version`
