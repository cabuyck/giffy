# Deployment Guide

## Quick Deploy to Render (Free)

1. **Push your code to GitHub** (if not already)

2. **Go to [render.com](https://render.com)** and sign up/login

3. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render should auto-detect the `render.yaml` file

4. **Set your Giphy API Key**:
   - In the service settings, add environment variable:
     - Key: `GIPHY_API_KEY`
     - Value: Your Giphy API key

5. **Deploy!** Click "Create Web Service"

Render will:
- Build the client (`npm run build:client`)
- Build the server (`cd server && npm run build`)
- Start the server (`cd server && npm start`)

Your app will be live at: `https://your-app-name.onrender.com`

---

## Manual Deploy (Alternative)

### 1. Build everything locally

```bash
# Build client
npm run build:client

# Build server
cd server
npm run build
cd ..
```

### 2. Deploy to any Node.js hosting

Upload/run the `server` directory with:
- `NODE_ENV=production`
- `GIPHY_API_KEY=your_key_here`
- Run: `npm start`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GIPHY_API_KEY` | Yes | Get from [developers.giphy.com](https://developers.giphy.com) |
| `NODE_ENV` | No | Set to `production` for production |
| `PORT` | No | Port (defaults to 3001) |
| `CLIENT_URL` | No | Only for dev mode CORS |
