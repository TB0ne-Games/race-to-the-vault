This development plan breaks the **Vault Heist** project into five distinct phases. By following this structure, you can ensure the core networking and hidden identity mechanics work perfectly before adding the complex path-building logic.

---

## Phase 1: Environment Setup & Networking

**Goal:** Establish the "Two-Screen" architecture where a Host (the Board) and Players (the Hands) can communicate over a local network or via a Room Code.

* **Development:** Set up the Node.js/Socket.io server and create the basic routing for "Host" vs. "Player" views.
* **Testing:** Open the app on two different devices. Ensure that when a player joins on one, their name appears immediately on the host screen.
* **Anti-Gravity Prompt:**

> "Build a mobile-responsive web app using React and Socket.io. Create two distinct views: a 'Host View' that displays a Room Code and a list of joined players, and a 'Player View' where users enter a name and the Room Code to join. Ensure real-time synchronization so the Host View updates the moment a player joins."

---

## Phase 2: Role Assignment & Private States

**Goal:** Implement the hidden identity logic and ensure each player sees only their own "Robber" or "Cop" role.

* 
**Development:** Create the deck-shuffling logic. Assign roles based on player count (e.g., 5 players = 2 Cops, 4 Robbers—note: Saboteur rules often include an extra card so the exact count is hidden).


* **Testing:** Start a 3-player game. Verify that each mobile device shows a different role and that the "Host" screen does *not* show who is who.
* **Anti-Gravity Prompt:**

> "Add a game-start logic to the existing Socket.io setup. When the host clicks 'Start,' the server should shuffle and distribute hidden roles ('Robber' or 'Cop') to each connected player based on the Saboteur player-count rules. Create a 'Tap to Reveal' UI component for the player's mobile screen to keep the role secret."
> 
> 

---

## Phase 3: The Gameboard & Path Placement

**Goal:** Build the  grid and the logic for connecting path tiles.

* **Development:** Create a grid system for the Host View. Implement tile-matching logic (top/bottom/left/right paths must align).


* **Testing:** Attempt to place a "dead-end" tile next to a "straight-path" tile. The system should reject the move if the paths don't connect.


* **Anti-Gravity Prompt:**

> "Create a  grid for the Host View. Define a 'Path Card' object with four boolean properties (top, bottom, left, right) representing openings. Implement a function that allows a player to 'place' a card from their hand onto the board only if the openings match the adjacent cards and it has a continuous connection to the starting 'Entrance' card."
> 
> 

---

## Phase 4: Action Cards & Tool States

**Goal:** Implement the "Sabotage" mechanics: breaking tools and peeking at vaults.

* 
**Development:** Add "Disable" states to players (Jammed Radio, Flat Tire). Add the "Map" logic to allow a player to see a "Goal Card" privately on their device.


* 
**Testing:** Have Player A play a "Flat Tire" card on Player B. Verify that Player B is now blocked from playing Path Cards until they play a "Fix" card.


* **Anti-Gravity Prompt:**

> "Implement Action Card logic. Create three 'Tool' states for each player. If a player receives a 'Broken Tool' card, they are barred from placing Path Cards until a matching 'Repair' card is played. Also, create a 'Map' action that sends the content of one 'Vault' card (Gold or Stone) only to the player who played the Map card."
> 
> 

---

## Phase 5: Win Conditions & Scoring

**Goal:** Define how a round ends and how "Money" (Gold Nuggets) is distributed.

* 
**Development:** Trigger a "Win" state when a path reaches the Vault with money. Implement the Saboteur-style gold distribution where the winner of the round gets first pick.


* **Testing:** Reach the vault and ensure the "Robber" team's score increases. Check if "Cops" win if the deck runs out before the vault is reached.


* **Anti-Gravity Prompt:**

> "Develop the end-of-round logic. If a Path Card connects to the 'Money Vault,' trigger a victory for the Robbers and distribute 'Gold Nugget' points. If the deck reaches zero and no paths are completed, trigger a Cop victory and award them points. Reset the board while keeping the players' total scores for a 3-round game."
> 
> 

---

