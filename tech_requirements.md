This Technical Requirement Document (TRD) outlines the specifications for a mobile browser-based game inspired by the mechanics of **Saboteur**. The game, titled **"Vault Heist,"** reimagines the original "Gold Miners vs. Saboteurs"  as a conflict between **Robbers** and **Cops** attempting to secure or protect a bank vault.

### 1. Project Overview

* **Title:** Vault Heist
* **Platform:** Mobile Web Browser (Cross-platform iOS/Android)
* **Genre:** Hidden Identity / Tile-Placement Strategy
* 
**Players:** 3–10 players 


* 
**Goal:** * **Robbers:** Create an uninterrupted path from the starting point to the correct vault (the one containing money).


* 
**Cops:** Prevent the Robbers from reaching the vault until the draw deck and player hands are exhausted.





### 2. Game Mechanics & Roles

The game utilizes a hidden identity system where roles are dealt secretly at the start of each round.

* 
**The Robbers (Miners):** Work together to build a path to the vault.


* 
**The Undercover Cops (Saboteurs):** Work to obstruct the path, create dead ends, or break the Robbers' tools, while trying to stay undetected.


* **The Board:** A grid-based layout. The "Entrance" (Start Card) and three "Vaults" (Goal Cards) are placed on the board. Only one vault contains the money.



### 3. Technical Requirements

#### 3.1 Network & Connectivity

* **Local WiFi Support:** The game must support low-latency communication over a local network.
* **Socket-Based Communication:** Implementation of WebSockets (e.g., Socket.io) for real-time state synchronization between the "Shared Board" and "Private Hands."
* **Game Lobby:** A host creates a room; other players join via a unique Room Code or QR code.

#### 3.2 Display Architecture (The "Two-Screen" System)

* **Shared Gameboard (Public View):** * One device (e.g., a tablet or a phone cast to a TV) acts as the primary gameboard.
* Displays the path maze, the entrance, the three vaults, and any active "Global Effects".




* **Player Hand (Private View):**
* Each player’s mobile browser displays their private role and their current hand of cards.


* Cards must remain hidden from other players.





#### 3.3 Card Types & Logic

* 
**Path Cards:** Tiles used to build the route from the entrance to the vaults. Cards must be played so all sides match adjacent tiles.


* **Action Cards:**
* 
**Disable (Broken Tools):** Prevents a player from playing Path Cards. In this theme: "Jammed Radio," "Flat Tire," or "Empty Magazine."


* 
**Enable (Fix Tools):** Removes a Disable card of the matching type.


* 
**Intelligence (Map):** Allows a player to privately peek at one of the three Vault cards to see if it contains the money.


* 
**Sabotage (Rockfall):** Allows a player to remove any existing Path Card from the board (except the Entrance or Vaults).





### 4. Game Flow & Logic

1. 
**Preparation:** Roles and starting hands are dealt based on player count.


2. **Player Turn:** A player must perform one of three actions:
* Play a Path Card to the maze.


* Play an Action Card on themselves or another player.


* Discard one card face-down (Pass).




3. 
**Drawing:** After playing or discarding, the player automatically draws a new card from the digital deck.


4. 
**Round End:** * Ends if a Robber connects a path to the correct Vault.


* Ends if the deck is empty and no more moves can be made.




5. 
**Scoring:** Money (Gold Nuggets) is distributed to the winning team. The player with the most money after three rounds is the winner.



### 5. UI/UX Requirements

* **Responsive Design:** Optimized for mobile portrait and landscape modes.
* **Drag-and-Drop:** Intuitive interface for dragging cards from the private hand onto the shared digital board.
* **Role Reveal:** A "Tap to Reveal" mechanic for the role card to ensure secrecy during the start of the game.
* 
**Visual Cues:** Clear indicators on the UI when a player is "Disabled" and cannot play path cards.
