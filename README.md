# Race to the Vault 🏛️💰🛡️

A high-stakes, digital board game of deception, strategy, and teamwork. Built with a premium glassmorphism aesthetic, **Race to the Vault** pits a crew of Robbers against a vigilant Cop in a race to secure the ultimate prize.

## 🎮 The Premise
- **The Robbers:** Your goal is to build a path from the entrance to the gold vault. Work together to navigate the grid and find the loot.
- **The Cop:** Your goal is to stop the robbers. Sabotage their tools, mislead them, and exhaust the deck to win.

## ✨ Premium Features
- **Glassmorphism UI:** A sleek, modern interface with real-time blur and glowing gold accents.
- **Dynamic Action Cards:** Sabotage tools (Flashlight, Drill, Map), Repair them, peek at vaults with Intel, or clear paths with Dynamite.
- **SVG Board:** High-fidelity path rendering using custom SVG components.
- **Real-Time Sync:** Responsive gameplay powered by Socket.io.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Vanilla CSS (Custom Design System)
- **Backend:** Node.js, Express, Socket.io
- **Styling:** Custom CSS with Glassmorphism and SVG Path Rendering

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/race-to-the-vault.git
   cd race-to-the-vault
   ```

2. **Setup the Server:**
   ```bash
   cd server
   npm install
   node index.js
   ```

3. **Setup the Client:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 🃏 Card Types
- **Path Cards:** Standard tiles used to build the route to the vaults.
- **Sabotage:** Break a player's tool (Flashlight, Drill, or Map). A player with a broken tool cannot place path cards!
- **Repair:** Fix your own or a teammate's broken tool.
- **Intel (Map):** Peek at a vault to see if it contains gold or is a dummy.
- **Dynamite:** Remove any path card from the board to create a roadblock.

## 🏛️ Victory Conditions
- **Robbers Win:** Create a continuous path from the entrance to the Gold Vault.
- **Cops Win:** The deck runs out and no player can make a move, OR the robbers can no longer reach any vault.

---
*Created with passion by the Heist Development Team.*