# Tic-Tac-Toe Arena 🎮

A modern, full-stack multiplayer Tic-Tac-Toe game built with React, TypeScript, and WebSocket technology. Features real-time multiplayer gameplay, AI opponents, and a comprehensive leaderboard system.

## 🚀 Features

### Game Modes
- **Multiplayer Mode**: Real-time matches against other online players
- **AI Mode**: Play against computer opponents with 3 difficulty levels (Easy, Medium, Hard)
- **Practice Mode**: Local single-player mode for testing strategies

### Core Features
- Server-authoritative game state management
- Real-time matchmaking system
- Persistent leaderboard with ranking system
- Mobile-responsive design with touch optimizations
- Progressive Web App (PWA) capabilities
- Automatic reconnection handling
- Multiple simultaneous games support

### Technical Highlights
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: WebSocket server with Bun runtime
- **AI**: Minimax algorithm implementation with configurable difficulty
- **Deployment**: Docker containerization, Railway deployment ready
- **Architecture**: Clean separation of concerns, modular component design

## 🏗️ Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui component library
│   ├── GameBoard.tsx   # Game board with responsive design
│   ├── GameModeSelection.tsx  # Mode selection interface
│   ├── Matchmaking.tsx # Matchmaking UI
│   ├── Leaderboard.tsx # Leaderboard display
│   └── ConnectionStatus.tsx   # Connection indicator
├── hooks/              # Custom React hooks
│   ├── useGame.ts      # Main game logic hook
│   └── useNakama.ts    # Legacy compatibility
├── lib/                # Utility libraries
│   ├── ai.ts          # AI/Minimax implementation
│   └── utils.ts       # General utilities
└── pages/              # Page components
    ├── Index.tsx       # Main game page
    └── NotFound.tsx    # 404 page
```

### Backend Architecture
The WebSocket server (`mock-nakama-server.ts`) handles:

- **Connection Management**: Player authentication and session handling
- **Matchmaking**: Queue-based player pairing system
- **Game State**: Server-authoritative game logic and validation
- **Statistics**: Persistent player stats and leaderboard generation
- **Real-time Communication**: WebSocket message routing and broadcasting

### Game State Flow
1. **Authentication**: Players connect and authenticate with unique usernames
2. **Mode Selection**: Choose between multiplayer, AI, or practice modes
3. **Matchmaking**: Queue system pairs players for multiplayer games
4. **Game Loop**: Server validates moves and broadcasts state updates
5. **Game End**: Results are calculated, stats updated, leaderboard refreshed

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) runtime
- Modern web browser with WebSocket support

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd lila-games-backend-quest-main
```

2. **Install dependencies**
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

3. **Start the WebSocket server** (in one terminal)
```bash
bun mock-nakama-server.ts
# Server will start on ws://localhost:7350/ws
```

4. **Start the frontend** (in another terminal)
```bash
bun run dev
# Frontend will start on http://localhost:8080
```

5. **Open multiple browser tabs** to test multiplayer functionality

### Production Build
```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## 🐳 Docker Deployment

### Build and run with Docker
```bash
# Build the Docker image
docker build -t tic-tac-toe-arena .

# Run the container
docker run -p 3000:3000 -p 7350:7350 tic-tac-toe-arena
```

### Environment Variables
Create a `.env` file based on `.env.example`:
```bash
VITE_NAKAMA_WS_URL=wss://your-domain.com/ws
PORT=7350
FRONTEND_PORT=3000
NODE_ENV=production
```

## 🚀 Deployment

### Railway Deployment
1. Connect your repository to [Railway](https://railway.app/)
2. The `railway.json` configuration will automatically handle deployment
3. Set environment variables in Railway dashboard
4. Deploy with a single click

### Manual Cloud Deployment
1. Build the Docker image
2. Deploy to your preferred cloud provider (AWS, GCP, Azure, etc.)
3. Ensure both HTTP (3000) and WebSocket (7350) ports are exposed
4. Configure load balancer for WebSocket connections if scaling

## 🎮 How to Play

### Multiplayer Mode
1. Select "Multiplayer" from the mode selection screen
2. Wait for matchmaking to find an opponent
3. Take turns placing X or O symbols
4. First to get 3 in a row wins!

### AI Mode
1. Choose "vs Computer" and select difficulty:
   - **Easy**: Random moves
   - **Medium**: Mix of random and optimal moves
   - **Hard**: Perfect minimax algorithm
2. You always play as X and go first
3. Try to beat the AI!

### Practice Mode
1. Select "Practice Mode" for local gameplay
2. Click cells to place symbols alternately
3. Perfect for testing strategies

## 🏆 Leaderboard System

The leaderboard tracks:
- **Wins**: Games won
- **Losses**: Games lost  
- **Rank**: Position based on win/loss ratio
- **Games Played**: Total matches

Stats persist across sessions and are saved to local file storage.

## 🔧 Technical Details

### AI Implementation
The computer opponent uses the **Minimax algorithm** with the following features:
- **Perfect Play**: On hard difficulty, the AI never loses
- **Depth-Limited Search**: Optimized for real-time gameplay
- **Configurable Difficulty**: Easy/Medium modes add randomness

### WebSocket Protocol
Custom message types for real-time communication:
```typescript
// Client to Server
authenticate: { username: string }
start_matchmaking: {}
make_move: { matchId: string, cellIndex: number }
cancel_matchmaking: {}
leave_match: { matchId: string }
get_leaderboard: {}

// Server to Client
match_found: { matchId: string, playerSymbol: 'X'|'O', opponentId: string }
game_update: { board: Board, currentTurn: 'X'|'O' }
game_end: { winner: 'X'|'O'|'draw', board: Board }
leaderboard_update: { entries: LeaderboardEntry[] }
```

### Mobile Optimizations
- **Touch-friendly**: 44px minimum touch targets
- **Responsive Design**: Scales from mobile to desktop
- **Touch Prevention**: Prevents unwanted selections
- **PWA Ready**: Installable as native app
- **Offline Fallback**: Works without server for practice mode

## 🧪 Testing

### Manual Testing Checklist
- [ ] Multiplayer matchmaking works with multiple browser tabs
- [ ] AI makes valid moves in all difficulty modes
- [ ] Practice mode allows alternating moves
- [ ] Leaderboard updates after game completion
- [ ] Mobile touch interface works correctly
- [ ] WebSocket reconnection handles network issues
- [ ] Game state synchronizes properly between players

### Automated Testing (Future Enhancement)
Consider adding:
- Unit tests for AI logic (`ai.ts`)
- Integration tests for WebSocket communication
- E2E tests with Playwright/Cypress
- Performance tests for concurrent games

## 🔄 Future Enhancements

### Planned Features
- [ ] **Database Integration**: PostgreSQL for persistent storage
- [ ] **User Accounts**: Registration and login system
- [ ] **Game Rooms**: Private rooms with invite codes
- [ ] **Spectator Mode**: Watch ongoing games
- [ ] **Tournament System**: Bracket-style competitions
- [ ] **Chat System**: In-game messaging
- [ ] **Game History**: Review past matches
- [ ] **Custom Themes**: Different visual styles
- [ ] **Sound Effects**: Audio feedback for moves
- [ ] **Push Notifications**: Game invites and turn reminders

### Scalability Improvements
- [ ] **Redis Session Store**: Shared state across server instances
- [ ] **Load Balancing**: Multiple server instances
- [ ] **CDN Integration**: Static asset optimization
- [ ] **Monitoring**: Application performance monitoring
- [ ] **Analytics**: Player behavior tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Add JSDoc comments for public APIs
- Ensure mobile responsiveness
- Test multiplayer functionality

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **shadcn/ui**: Beautiful UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Comprehensive icon set
- **Bun**: Fast JavaScript runtime
- **Railway**: Simple deployment platform

---

Built with ❤️ for the LILA Games engineering challenge.

**Live Demo**: [Deploy your own instance](#deployment) | **Source Code**: [GitHub Repository](https://github.com/your-username/tic-tac-toe-arena)
