# Deployment Guide: Railway Backend + Vercel Frontend

## 🚀 Quick Deployment Steps

### 1. Deploy Backend to Railway

1. **Connect Repository to Railway:**
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Add Railway backend with PostgreSQL"
   git push origin main
   ```

2. **Create Railway Project:**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the Node.js project

3. **Configure Environment Variables in Railway:**
   ```
   DATABASE_URL=postgresql://postgres:IKFaIuUBkxCJMftuLCWJWnGfMEOUEidi@shinkansen.proxy.rlwy.net:57860/railway
   NODE_ENV=production
   PORT=7350
   ```

4. **Deploy:**
   - Railway will automatically build and deploy
   - Note your Railway app URL (e.g., `https://your-app.up.railway.app`)

### 2. Deploy Frontend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # From the project root directory
   vercel

   # Follow the prompts:
   # - Set up and deploy? Y
   # - Which scope? (your account)
   # - Link to existing project? N
   # - Project name: tic-tac-toe-arena
   # - Directory: ./
   ```

4. **Set Environment Variable:**
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Add: `VITE_NAKAMA_WS_URL = wss://your-railway-app.up.railway.app`
   - Redeploy: `vercel --prod`

## 🔧 Environment Variables Setup

### Railway Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:IKFaIuUBkxCJMftuLCWJWnGfMEOUEidi@shinkansen.proxy.rlwy.net:57860/railway
NODE_ENV=production
PORT=7350
```

### Vercel Frontend
```bash
VITE_NAKAMA_WS_URL=wss://your-railway-backend.up.railway.app
```

## 📝 Configuration Files

### Railway Configuration (`railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "startCommand": "cd backend && npm start"
  }
}
```

### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist", 
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "VITE_NAKAMA_WS_URL": "@vite_nakama_ws_url"
  }
}
```

## 🎯 What Each Platform Handles

### Railway (Backend)
- ✅ WebSocket server (Node.js)
- ✅ PostgreSQL database integration
- ✅ Real-time game state management
- ✅ Player authentication & matchmaking
- ✅ Leaderboard with persistent storage
- ✅ Auto-scaling and health checks

### Vercel (Frontend)
- ✅ React SPA (Static Site Generation)
- ✅ Global CDN distribution
- ✅ Automatic deployments from Git
- ✅ Environment variable injection
- ✅ HTTPS by default

## 🧪 Testing the Deployment

1. **Backend Health Check:**
   ```bash
   curl https://your-railway-app.up.railway.app:7351/health
   ```

2. **Frontend Access:**
   ```bash
   https://your-vercel-app.vercel.app
   ```

3. **WebSocket Connection:**
   - Open browser console on frontend
   - Look for "Connected to game server" message
   - Test multiplayer by opening multiple tabs

## 🔍 Troubleshooting

### Common Issues:

1. **WebSocket Connection Failed:**
   - Check `VITE_NAKAMA_WS_URL` in Vercel environment variables
   - Ensure Railway backend is running (check logs)
   - Verify Railway app URL is correct

2. **Database Connection Error:**
   - Verify `DATABASE_URL` is correct in Railway
   - Check PostgreSQL service is running
   - Look at Railway logs for database connection errors

3. **Frontend Build Fails:**
   - Check if all dependencies are in `package.json`
   - Verify build command in Vercel settings
   - Check for TypeScript errors

### Railway Logs:
```bash
# View logs in Railway dashboard or CLI
railway logs --tail
```

### Vercel Logs:
```bash
# View deployment logs
vercel logs your-deployment-url
```

## 🔄 Auto-Deployment Pipeline

### GitHub Integration:
1. **Railway:** Auto-deploys on push to `main` branch
2. **Vercel:** Auto-deploys on push to `main` branch
3. **Environment Variables:** Managed separately in each platform
4. **Database:** Persistent storage with automatic backups

## 📊 Monitoring

### Railway Dashboard:
- Real-time metrics (CPU, Memory, Network)
- Database connections and queries
- WebSocket connections count
- Error rates and response times

### Vercel Analytics:
- Page views and performance
- Build status and deployment history
- Core Web Vitals
- Geographic distribution

## 🚦 Production Checklist

- [ ] Backend deployed to Railway with PostgreSQL
- [ ] Frontend deployed to Vercel with correct WebSocket URL
- [ ] Environment variables configured on both platforms
- [ ] Database tables created and accessible
- [ ] WebSocket connections working across platforms
- [ ] Leaderboard persistence functioning
- [ ] Multiple simultaneous games supported
- [ ] Mobile responsive design verified
- [ ] HTTPS/WSS security enabled
- [ ] Error monitoring configured

## 🎉 Success!

Your Tic-Tac-Toe Arena is now deployed with:
- **Backend:** Railway (https://your-app.up.railway.app)
- **Frontend:** Vercel (https://your-app.vercel.app) 
- **Database:** PostgreSQL with persistent leaderboard
- **Real-time:** WebSocket multiplayer functionality

Players can now enjoy multiplayer Tic-Tac-Toe with persistent statistics across the globe! 🌍