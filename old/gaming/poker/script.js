// --- Card Deck Data with Full Names ---
const suits = { '♠': 'Spades', '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs' };
const ranks = {
    'A': 'Ace', 'K': 'King', 'Q': 'Queen', 'J': 'Jack', 'T': 'Ten',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2'
};

const deckOptions = [{ text: '--- Select Card ---', value: '--- Select Card ---' }];

Object.keys(suits).forEach(suitSymbol => {
    const suitName = suits[suitSymbol];
    Object.keys(ranks).forEach(rankSymbol => {
        const rankName = ranks[rankSymbol];
        const longName = `${rankName} of ${suitName}`;
        const shortName = rankSymbol + suitSymbol;
        deckOptions.push({ text: longName, value: shortName });
    });
});

// --- Initialization and Dropdown Population ---
const communityCardSelectors = ['flop1', 'flop2', 'flop3', 'turn', 'river'];

function populateDropdown(selectElement) {
    deckOptions.forEach(optionData => {
        const option = document.createElement('option');
        option.value = optionData.value;
        option.textContent = optionData.text;
        selectElement.appendChild(option);
    });
}

function populateDropdowns() {
    communityCardSelectors.forEach(id => {
        const select = document.getElementById(id);
        populateDropdown(select);
    });
}

populateDropdowns();

// --- State Management ---
let pokerState = {
    flop1: '--- Select Card ---',
    flop2: '--- Select Card ---',
    flop3: '--- Select Card ---',
    turn: '--- Select Card ---',
    river: '--- Select Card ---',
    isFlopRevealed: false,
    isTurnRevealed: false,
    isRiverRevealed: false,
    players: [],
    playerCount: 6,
    currentTurn: null,
    winner: null,
    winningHand: null,
    pot: 0,
    gameMode: null,
    configuring: true,
    currentBet: 0
};

function saveState() {
    localStorage.setItem('pokerState', JSON.stringify(pokerState));
}

function getRandomCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    return rank + suit;
}

function dealUniqueCards() {
    const usedCards = new Set();
    
    function getUniqueCard() {
        let card;
        let attempts = 0;
        do {
            card = getRandomCard();
            attempts++;
            if (attempts > 100) {
                console.error('Too many attempts to find unique card');
                break;
            }
        } while (usedCards.has(card));
        usedCards.add(card);
        return card;
    }
    
    return {
        getUniqueCard: getUniqueCard,
        usedCards: usedCards
    };
}

function startSinglePlayer() {
    pokerState.gameMode = 'single';
    pokerState.configuring = false;
    pokerState.playerCount = 6;
    pokerState.players = [];
    pokerState.pot = 0;
    pokerState.bettingRound = 'flop';
    pokerState.playersActed = [];
    pokerState.currentBet = 0;
    
    const cardDealer = dealUniqueCards();
    
    pokerState.players.push({
        id: 'p1',
        name: 'You',
        balance: 1000,
        action: null,
        actionValue: 0,
        folded: false,
        card1: cardDealer.getUniqueCard(),
        card2: cardDealer.getUniqueCard(),
        cardsRevealed: true,
        isAI: false,
        currentRoundBet: 0
    });
    
    for (let i = 2; i <= 6; i++) {
        pokerState.players.push({
            id: `p${i}`,
            name: `AI Player ${i-1}`,
            balance: 1000,
            action: null,
            actionValue: 0,
            folded: false,
            card1: cardDealer.getUniqueCard(),
            card2: cardDealer.getUniqueCard(),
            cardsRevealed: false,
            isAI: true,
            currentRoundBet: 0
        });
    }
    
    pokerState.flop1 = cardDealer.getUniqueCard();
    pokerState.flop2 = cardDealer.getUniqueCard();
    pokerState.flop3 = cardDealer.getUniqueCard();
    pokerState.turn = cardDealer.getUniqueCard();
    pokerState.river = cardDealer.getUniqueCard();
    
    pokerState.isFlopRevealed = true;
    pokerState.isTurnRevealed = false;
    pokerState.isRiverRevealed = false;
    
    pokerState.currentTurn = 'p1';
    
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContent').style.display = 'block';
    document.getElementById('multiplayerGameControls').style.display = 'none';
    document.getElementById('multiplayerWinners').style.display = 'none';
    document.getElementById('multiplayerCommunityCards').style.display = 'none';
    document.getElementById('singlePlayerControls').style.display = 'block';
    document.getElementById('gameModeText').textContent = 'Single Player Mode';
    
    saveState();
    renderSinglePlayerControls();
}

function resetSinglePlayerGame() {
    // Check if we need a hard reset (all but one player have $0)
    const playersWithMoney = pokerState.players.filter(p => p.balance > 0);
    
    if (playersWithMoney.length <= 1) {
        // Hard reset - everyone gets starting balance
        startSinglePlayer();
        return;
    }
    
    // Soft reset - preserve balances
    const cardDealer = dealUniqueCards();
    
    // Reset game state but keep balances and player structure
    pokerState.pot = 0;
    pokerState.bettingRound = 'flop';
    pokerState.playersActed = [];
    pokerState.currentBet = 0;
    pokerState.winner = null;
    pokerState.winningHand = null;
    
    // Deal new cards to all players
    pokerState.players.forEach(player => {
        player.action = null;
        player.actionValue = 0;
        player.folded = false;
        player.card1 = cardDealer.getUniqueCard();
        player.card2 = cardDealer.getUniqueCard();
        player.cardsRevealed = player.id === 'p1'; // Only reveal human player's cards
        player.currentRoundBet = 0;
    });
    
    // Deal new community cards
    pokerState.flop1 = cardDealer.getUniqueCard();
    pokerState.flop2 = cardDealer.getUniqueCard();
    pokerState.flop3 = cardDealer.getUniqueCard();
    pokerState.turn = cardDealer.getUniqueCard();
    pokerState.river = cardDealer.getUniqueCard();
    
    pokerState.isFlopRevealed = true;
    pokerState.isTurnRevealed = false;
    pokerState.isRiverRevealed = false;
    
    pokerState.currentTurn = 'p1';
    
    saveState();
    renderSinglePlayerControls();
}

function renderSinglePlayerControls() {
    const humanPlayer = pokerState.players[0];
    const container = document.getElementById('humanPlayerControl');
    
    let html = `
        <div class="player-card active" style="width: 100%; max-width: 400px; margin: 20px auto;">
            <h3 style="margin: 0 0 15px 0; color: #00ce00;">${humanPlayer.name}</h3>
            
            <label>Balance: $</label>
            <div style="font-size: 1.3em; color: #00ce00; margin-bottom: 15px;">${humanPlayer.balance.toLocaleString()}</div>
            
            <label>Your Cards:</label>
            <div style="font-size: 1.5em; margin-bottom: 15px; padding: 10px; background-color: #2a2a2a; border-radius: 5px;">
                ${humanPlayer.card1} ${humanPlayer.card2}
            </div>
            
            <div class="action-input-group">
                <label for="raiseAmount">Raise Amount: $</label>
                <input type="number" id="raiseAmount" value="10" min="0" style="width: calc(100% - 22px);">
            </div>
            
            <div class="player-action-buttons">
                <button onclick="singlePlayerAction('check')">Check</button>
                <button class="info" onclick="singlePlayerAction('call')">Call</button>
                <button class="warning" onclick="singlePlayerAction('raise')">Raise</button>
                <button class="danger" onclick="singlePlayerAction('fold')">Fold</button>
            </div>
        </div>
    `;
    
    // Show AI players' cards if revealed
    const aiPlayers = pokerState.players.slice(1);
    if (aiPlayers.some(p => p.cardsRevealed)) {
        html += '<div style="margin-top: 30px;"><h3 style="color: #5beb5b; text-align: center;">Other Players</h3>';
        html += '<div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">';
        
        aiPlayers.forEach(player => {
            if (player.cardsRevealed) {
                const cardDisplay = player.folded ? '(Folded)' : `${player.card1} ${player.card2}`;
                html += `
                    <div class="player-card" style="width: 280px; ${player.folded ? 'opacity: 0.6;' : ''}">
                        <h3 style="margin: 0 0 10px 0; color: #5beb5b;">${player.name}</h3>
                        <label>Balance: ${player.balance.toLocaleString()}</label>
                        <div style="font-size: 1.3em; margin-top: 10px; padding: 10px; background-color: #2a2a2a; border-radius: 5px;">
                            ${cardDisplay}
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div></div>';
    }
    
    container.innerHTML = html;
    updatePotDisplay();
}

async function singlePlayerAction(action) {
    const humanPlayer = pokerState.players[0];
    
    if (humanPlayer.folded) return;
    
    if (action === 'check') {
        if (pokerState.currentBet > humanPlayer.currentRoundBet) {
            alert("You cannot check - there's a bet to call.");
            return;
        }
        humanPlayer.action = 'check';
    } else if (action === 'call') {
        const callAmount = pokerState.currentBet - humanPlayer.currentRoundBet;
        if (callAmount <= 0) {
            alert("Nothing to call - use check instead.");
            return;
        }
        if (humanPlayer.balance < callAmount) {
            alert("You don't have enough balance to call.");
            return;
        }
        humanPlayer.balance -= callAmount;
        humanPlayer.currentRoundBet += callAmount;
        pokerState.pot += callAmount;
        humanPlayer.action = 'call';
        humanPlayer.actionValue = callAmount;
    } else if (action === 'raise') {
        const raiseToAmount = parseInt(document.getElementById('raiseAmount').value, 10) || 0;
        
        if (raiseToAmount <= pokerState.currentBet) {
            alert(`You must raise to more than the current bet of ${pokerState.currentBet}`);
            return;
        }
        
        const amountToAdd = raiseToAmount - humanPlayer.currentRoundBet;
        if (humanPlayer.balance < amountToAdd) {
            alert("You don't have enough balance for this raise.");
            return;
        }
        
        humanPlayer.balance -= amountToAdd;
        humanPlayer.currentRoundBet = raiseToAmount;
        pokerState.pot += amountToAdd;
        pokerState.currentBet = raiseToAmount;
        humanPlayer.action = 'raise';
        humanPlayer.actionValue = amountToAdd;
        pokerState.playersActed = [];
    } else if (action === 'fold') {
        humanPlayer.folded = true;
        humanPlayer.action = 'fold';
    }
    
    pokerState.playersActed.push('p1');
    
    saveState();
    renderSinglePlayerControls();
    updatePotDisplay();
    
    const activePlayers = pokerState.players.filter(p => !p.folded);
    if (activePlayers.length === 1) {
        announceWinner(activePlayers[0], 'Last Player Standing');
        return;
    }
    
    await playAITurns();
    checkBettingRoundComplete();
}

async function playAITurns() {
    let continueLoop = true;
    
    while (continueLoop) {
        let anyoneActed = false;
        
        for (let i = 1; i < pokerState.players.length; i++) {
            const player = pokerState.players[i];
            
            if (player.folded) continue;
            
            if (pokerState.playersActed.includes(player.id) && 
                player.currentRoundBet === pokerState.currentBet) {
                continue;
            }
            
            anyoneActed = true;
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const decision = makeAIBettingDecision(player);
            
            if (decision.action === 'check') {
                player.action = 'check';
            } else if (decision.action === 'call') {
                const callAmount = pokerState.currentBet - player.currentRoundBet;
                if (callAmount > 0) {
                    const actualCall = Math.min(callAmount, player.balance);
                    player.balance -= actualCall;
                    player.currentRoundBet += actualCall;
                    pokerState.pot += actualCall;
                    player.action = 'call';
                    player.actionValue = actualCall;
                }
            } else if (decision.action === 'raise') {
                const raiseToAmount = decision.raiseToAmount;
                const amountToAdd = raiseToAmount - player.currentRoundBet;
                
                if (amountToAdd > 0 && player.balance >= amountToAdd) {
                    player.balance -= amountToAdd;
                    player.currentRoundBet = raiseToAmount;
                    pokerState.pot += amountToAdd;
                    pokerState.currentBet = raiseToAmount;
                    player.action = 'raise';
                    player.actionValue = amountToAdd;
                    
                    // Reset ALL players who need to respond to the raise, including the human player
                    pokerState.playersActed = pokerState.playersActed.filter(id => id === player.id);
                }
            } else if (decision.action === 'fold') {
                player.folded = true;
                player.action = 'fold';
            }
            
            if (!pokerState.playersActed.includes(player.id)) {
                pokerState.playersActed.push(player.id);
            }
            
            saveState();
            updatePotDisplay();
            
            const activePlayers = pokerState.players.filter(p => !p.folded);
            if (activePlayers.length === 1) {
                setTimeout(() => announceWinner(activePlayers[0], 'Last Player Standing'), 500);
                return;
            }
        }
        
        // Check if human player (p1) still needs to act
        const humanPlayer = pokerState.players[0];
        if (!humanPlayer.folded && 
            humanPlayer.currentRoundBet < pokerState.currentBet &&
            !pokerState.playersActed.includes('p1')) {
            // Human needs to respond to a bet/raise, so stop AI turns
            renderSinglePlayerControls();
            return;
        }
        
        if (!anyoneActed) {
            continueLoop = false;
        }
    }
}

function makeAIBettingDecision(player) {
    const balance = player.balance;
    const pot = pokerState.pot;
    const currentBet = pokerState.currentBet;
    const playerBet = player.currentRoundBet;
    const callAmount = currentBet - playerBet;
    
    const random = Math.random();
    
    if (callAmount > 0) {
        const callPressure = callAmount / Math.max(balance, 1);

        if (balance < callAmount || random < (0.05 + callPressure * 0.25)) {
            return { action: 'fold' };
        } else if (random < 0.65) {
            return { action: 'call' };
        } else {
            const raiseAmount = Math.floor(Math.random() * pot * 0.5) + currentBet + 10;
            const finalRaise = Math.min(raiseAmount, currentBet + balance);
            return { action: 'raise', raiseToAmount: Math.max(finalRaise, currentBet + 10) };
        }
    } else {
        if (random < 0.70) {
            return { action: 'check' };
        } else if (random < 0.90) {
            return { action: 'raise', raiseToAmount: currentBet + 10 };
        }
    }
}

function checkBettingRoundComplete() {
    const activePlayers = pokerState.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
        setTimeout(() => announceWinner(activePlayers[0], 'Last Player Standing'), 500);
        return;
    }
    
    const allActed = activePlayers.every(p => pokerState.playersActed.includes(p.id));
    
    if (!allActed) {
        return;
    }
    
    const allMatched = activePlayers.every(p => 
        p.currentRoundBet === pokerState.currentBet
    );
    
    if (allActed && allMatched) {
        advanceBettingRound();
    }
}

function advanceBettingRound() {
    if (pokerState.bettingRound === 'flop') {
        pokerState.bettingRound = 'turn';
        pokerState.isTurnRevealed = true;
        
        pokerState.players.forEach(p => {
            p.action = null;
            p.actionValue = 0;
            p.currentRoundBet = 0;
        });
        pokerState.playersActed = [];
        pokerState.currentBet = 0;
        
        saveState();
        renderSinglePlayerControls();
        
        if (pokerState.players[0].folded) {
            setTimeout(() => playAITurns().then(() => checkBettingRoundComplete()), 1000);
        }
    } else if (pokerState.bettingRound === 'turn') {
        pokerState.bettingRound = 'river';
        pokerState.isRiverRevealed = true;
        
        pokerState.players.forEach(p => {
            p.action = null;
            p.actionValue = 0;
            p.currentRoundBet = 0;
        });
        pokerState.playersActed = [];
        pokerState.currentBet = 0;
        
        saveState();
        renderSinglePlayerControls();
        
        if (pokerState.players[0].folded) {
            setTimeout(() => playAITurns().then(() => checkBettingRoundComplete()), 1000);
        }
    } else if (pokerState.bettingRound === 'river') {
        pokerState.bettingRound = 'showdown';
        determineWinner();
    }
}

function determineWinner() {
    const activePlayers = pokerState.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        announceWinner(winner, 'Last Player Standing');
        return;
    }
    
    pokerState.players.forEach(p => {
        if (!p.folded) p.cardsRevealed = true;
    });
    
    // Evaluate each player's hand
    const communityCards = [pokerState.flop1, pokerState.flop2, pokerState.flop3, pokerState.turn, pokerState.river];
    const playerHands = activePlayers.map(player => {
        const allCards = [player.card1, player.card2, ...communityCards];
        const handRank = evaluateHand(allCards);
        return {
            player: player,
            handRank: handRank
        };
    });
    
    // Sort by hand strength (higher is better)
    playerHands.sort((a, b) => b.handRank.rank - a.handRank.rank);
    
    const winner = playerHands[0].player;
    const winningHand = playerHands[0].handRank.name;
    
    announceWinner(winner, winningHand);
}

function evaluateHand(cards) {
    // Parse cards into ranks and suits
    const parsed = cards.map(card => {
        if (card === '--- Select Card ---') return null;
        const rank = card[0];
        const suit = card[1];
        return { rank, suit, numRank: rankToNumber(rank) };
    }).filter(c => c !== null);
    
    if (parsed.length < 7) {
        return { rank: 0, name: 'Incomplete Hand' };
    }
    
    // Get all possible 5-card combinations
    const combinations = getAllCombinations(parsed, 5);
    
    // Evaluate each combination and return the best
    let bestHand = { rank: 0, name: 'High Card' };
    for (const combo of combinations) {
        const handRank = evaluateFiveCards(combo);
        if (handRank.rank > bestHand.rank) {
            bestHand = handRank;
        }
    }
    
    return bestHand;
}

function rankToNumber(rank) {
    const ranks = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };
    return ranks[rank] || 0;
}

function getAllCombinations(arr, size) {
    const result = [];
    
    function combine(start, chosen) {
        if (chosen.length === size) {
            result.push([...chosen]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            chosen.push(arr[i]);
            combine(i + 1, chosen);
            chosen.pop();
        }
    }
    
    combine(0, []);
    return result;
}

function evaluateFiveCards(cards) {
    const ranks = cards.map(c => c.numRank).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    
    // Count ranks
    const rankCounts = {};
    ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    const uniqueRanks = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);
    
    // Check flush
    const isFlush = suits.every(s => s === suits[0]);
    
    // Check straight
    let isStraight = false;
    if (uniqueRanks.length === 5) {
        if (uniqueRanks[0] - uniqueRanks[4] === 4) {
            isStraight = true;
        }
        // Check for A-2-3-4-5 straight (wheel)
        if (uniqueRanks[0] === 14 && uniqueRanks[1] === 5 && uniqueRanks[2] === 4 && uniqueRanks[3] === 3 && uniqueRanks[4] === 2) {
            isStraight = true;
        }
    }
    
    // Royal Flush
    if (isFlush && isStraight && uniqueRanks[0] === 14 && uniqueRanks[1] === 13) {
        return { rank: 10, name: 'Royal Flush' };
    }
    
    // Straight Flush
    if (isFlush && isStraight) {
        return { rank: 9, name: 'Straight Flush' };
    }
    
    // Four of a Kind
    if (counts[0] === 4) {
        return { rank: 8, name: 'Four of a Kind' };
    }
    
    // Full House
    if (counts[0] === 3 && counts[1] === 2) {
        return { rank: 7, name: 'Full House' };
    }
    
    // Flush
    if (isFlush) {
        return { rank: 6, name: 'Flush' };
    }
    
    // Straight
    if (isStraight) {
        return { rank: 5, name: 'Straight' };
    }
    
    // Three of a Kind
    if (counts[0] === 3) {
        return { rank: 4, name: 'Three of a Kind' };
    }
    
    // Two Pair
    if (counts[0] === 2 && counts[1] === 2) {
        return { rank: 3, name: 'Two Pair' };
    }
    
    // One Pair
    if (counts[0] === 2) {
        return { rank: 2, name: 'One Pair' };
    }
    
    // High Card
    return { rank: 1, name: 'High Card' };
}

function announceWinner(winner, hand) {
    const potAmount = pokerState.pot;
    winner.balance += potAmount;
    
    // Reveal all player cards
    pokerState.players.forEach(p => {
        p.cardsRevealed = true;
    });
    
    pokerState.winner = winner.id;
    pokerState.winningHand = hand;
    pokerState.pot = 0;
    
    saveState();
    updatePotDisplay();
    renderSinglePlayerControls();
    
    alert(`${winner.name} wins ${potAmount.toLocaleString()} with ${hand}!`);
    
    setTimeout(() => {
        if (confirm('Start a new game?')) {
            resetSinglePlayerGame();
        }
    }, 1000);
}

function startMultiplayer() {
    pokerState.gameMode = 'multi';
    pokerState.configuring = false;
    
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContent').style.display = 'block';
    document.getElementById('multiplayerGameControls').style.display = 'block';
    document.getElementById('multiplayerWinners').style.display = 'block';
    document.getElementById('multiplayerCommunityCards').style.display = 'block';
    document.getElementById('singlePlayerControls').style.display = 'none';
    document.getElementById('gameModeText').textContent = 'Use this panel to manage the game and display community cards.';
    
    saveState();
    loadInitialState();
}

function loadInitialState() {
    communityCardSelectors.forEach(id => {
        const select = document.getElementById(id);
        select.value = pokerState[id];
    });
    document.getElementById('playerCount').value = pokerState.playerCount;
    updatePotDisplay();
    renderPlayerControls();
}

function updatePotDisplay() {
    const potDisplay = document.getElementById('currentPot');
    const potDisplaySingle = document.getElementById('currentPotSingle');
    const potValue = pokerState.pot || 0;
    
    if (potDisplay) {
        potDisplay.textContent = potValue.toLocaleString();
    }
    if (potDisplaySingle) {
        potDisplaySingle.textContent = potValue.toLocaleString();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadInitialState();
});

if (document.readyState !== 'loading') {
    loadInitialState();
} 

function updateCards() {
    pokerState.flop1 = document.getElementById('flop1').value;
    pokerState.flop2 = document.getElementById('flop2').value;
    pokerState.flop3 = document.getElementById('flop3').value;
    pokerState.turn = document.getElementById('turn').value;
    pokerState.river = document.getElementById('river').value;
    saveState();
}

function revealCards(stage) {
    if (stage === 'flop') {
        pokerState.isFlopRevealed = true;
    } else if (stage === 'turn') {
        pokerState.isTurnRevealed = true;
    } else if (stage === 'river') {
        pokerState.isRiverRevealed = true;
    }
    saveState();
}

function hideCards(stage) {
    if (stage === 'flop') {
        pokerState.isFlopRevealed = false;
    } else if (stage === 'turn') {
        pokerState.isTurnRevealed = false;
    } else if (stage === 'river') {
        pokerState.isRiverRevealed = false;
    }
    saveState();
}

function initializeGame() {
    const count = parseInt(document.getElementById('playerCount').value, 10);
    const startingBal = parseInt(document.getElementById('startingBalance').value, 10);

    if (isNaN(count) || count < 2 || count > 50) {
        alert("Please enter a valid player count between 2 and 50.");
        return;
    }
    if (isNaN(startingBal) || startingBal < 0) {
        alert("Please enter a valid starting balance (non-negative number).");
        return;
    }

    pokerState.playerCount = count;
    pokerState.players = [];
    pokerState.pot = 0;
    for (let i = 1; i <= count; i++) {
        pokerState.players.push({
            id: `p${i}`,
            name: `Player ${i}`,
            balance: startingBal,
            action: null,
            actionValue: 0,
            folded: false,
            card1: '--- Select Card ---',
            card2: '--- Select Card ---',
            cardsRevealed: false,
            isAI: false
        });
    }
    pokerState.currentTurn = 'p1';
    saveState();
    updatePotDisplay();
    renderPlayerControls();
}

async function toggleAI(playerId) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    const player = pokerState.players[playerIndex];
    player.isAI = !player.isAI;
    
    saveState();
    renderPlayerControls();
    
    if (player.isAI && pokerState.currentTurn === playerId) {
        await makeAIMove(playerId);
    }
}

async function makeAIMove(playerId) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    const player = pokerState.players[playerIndex];
    const decision = makeSimpleAIDecision(player);
    
    if (decision.action === 'call') {
        document.getElementById(`call-${playerId}`).value = decision.amount;
    } else if (decision.action === 'raise') {
        document.getElementById(`raise-${playerId}`).value = decision.amount;
    }
    
    playerAction(playerId, decision.action);
}

function makeSimpleAIDecision(player) {
    const balance = player.balance;
    const pot = pokerState.pot;
    const hasCards = player.card1 !== '--- Select Card ---' && player.card2 !== '--- Select Card ---';
    
    if (!hasCards || balance <= 0) {
        return { action: 'fold', amount: 0 };
    }
    
    const currentIndex = pokerState.players.findIndex(p => p.id === player.id);
    let previousPlayerAction = null;
    
    for (let i = 1; i < pokerState.players.length; i++) {
        const prevIndex = (currentIndex - i + pokerState.players.length) % pokerState.players.length;
        const prevPlayer = pokerState.players[prevIndex];
        if (prevPlayer.action && !prevPlayer.folded) {
            previousPlayerAction = prevPlayer.action;
            break;
        }
    }
    
    const random = Math.random();
    
    if (previousPlayerAction === 'call' || previousPlayerAction === 'raise') {
        if (random < 0.25) {
            return { action: 'fold', amount: 0 };
        } else if (random < 0.70) {
            const callAmount = Math.min(Math.floor(pot * 0.3), balance);
            return { action: 'call', amount: Math.max(callAmount, 10) };
        } else {
            const raiseAmount = Math.min(Math.floor(pot * 0.6), balance);
            return { action: 'raise', amount: Math.max(raiseAmount, 20) };
        }
    } else {
        if (random < 0.15) {
            return { action: 'fold', amount: 0 };
        } else if (random < 0.50) {
            return { action: 'check', amount: 0 };
        } else if (random < 0.75) {
            const callAmount = Math.min(Math.floor(pot * 0.3), balance);
            return { action: 'call', amount: Math.max(callAmount, 10) };
        } else {
            const raiseAmount = Math.min(Math.floor(pot * 0.6), balance);
            return { action: 'raise', amount: Math.max(raiseAmount, 20) };
        }
    }
}

function renderPlayerControls() {
    const container = document.getElementById('playerControls');
    container.innerHTML = '';

    if (pokerState.players.length === 0) {
        container.innerHTML = '<p>No players initialized. Click "Initialize Game" to begin.</p>';
        updateWinnerDropdown();
        return;
    }

    pokerState.players.forEach(player => {
        const isActive = pokerState.currentTurn === player.id;
        const playerCard = document.createElement('div');
        playerCard.className = `player-card ${isActive ? 'active' : ''}`;
        playerCard.id = `player-card-${player.id}`;
        
        const currentBalance = typeof player.balance === 'number' ? player.balance : parseInt(player.balance, 10) || 0;
        
        const aiButtonHTML = player.isAI ? `<div style="margin-top: 10px;"><button onclick="makeAIMove('${player.id}')" class="info" style="width: 100%; margin: 0;">🤖 Make AI Move</button></div>` : '';
        
        playerCard.innerHTML = `
            <div class="player-card-header">
                <h3 style="margin: 0; color: ${isActive ? '#00ce00' : '#5beb5b'};">${player.name}</h3>
                <div style="display: flex; gap: 5px;">
                    <button class="info" onclick="setTurn('${player.id}')">Set Turn</button>
                    <button class="${player.isAI ? 'warning' : ''}" onclick="toggleAI('${player.id}')" style="min-width: 70px;">
                        ${player.isAI ? '🤖 AI ON' : 'Set AI'}
                    </button>
                </div>
            </div>
            
            <label for="name-${player.id}">Player Name:</label>
            <input type="text" id="name-${player.id}" value="${player.name}" onchange="updatePlayerName('${player.id}', this.value)">
            
            <label for="balance-${player.id}">Balance: $</label>
            <input type="number" id="balance-${player.id}" value="${currentBalance}" onchange="updatePlayerBalance('${player.id}', this.value)">
            
            <label for="card1-${player.id}">Card 1:</label>
            <select id="card1-${player.id}" onchange="updatePlayerCard('${player.id}', 'card1', this.value)"></select>
            
            <label for="card2-${player.id}">Card 2:</label>
            <select id="card2-${player.id}" onchange="updatePlayerCard('${player.id}', 'card2', this.value)"></select>
            
            <div class="card-buttons">
                <button class="info" onclick="revealPlayerCards('${player.id}')">Reveal Cards</button>
                <button onclick="hidePlayerCards('${player.id}')">Hide Cards</button>
            </div>
            
            <div class="action-input-group">
                <label for="call-${player.id}">Call Amount: $</label>
                <input type="number" id="call-${player.id}" value="${player.action === 'call' ? player.actionValue : 0}" min="0">
            </div>
            
            <div class="action-input-group">
                <label for="raise-${player.id}">Raise Amount: $</label>
                <input type="number" id="raise-${player.id}" value="${player.action === 'raise' ? player.actionValue : 0}" min="0">
            </div>
            
            <div class="player-action-buttons">
                <button onclick="playerAction('${player.id}', 'check')">Check</button>
                <button class="info" onclick="playerAction('${player.id}', 'call')">Call</button>
                <button class="warning" onclick="playerAction('${player.id}', 'raise')">Raise</button>
                <button class="danger" onclick="playerAction('${player.id}', 'fold')">Fold</button>
                <button onclick="clearAction('${player.id}')">Clear</button>
            </div>
            ${aiButtonHTML}
        `;
        
        container.appendChild(playerCard);
        
        const card1Select = document.getElementById(`card1-${player.id}`);
        const card2Select = document.getElementById(`card2-${player.id}`);
        populateDropdown(card1Select);
        populateDropdown(card2Select);
        card1Select.value = player.card1;
        card2Select.value = player.card2;
    });
    
    updateWinnerDropdown();
}

function updateWinnerDropdown() {
    const winnerSelect = document.getElementById('winnerPlayer');
    winnerSelect.innerHTML = '<option value="">-- Select Player --</option>';
    
    pokerState.players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = player.name;
        winnerSelect.appendChild(option);
    });
    
    if (pokerState.winner) {
        winnerSelect.value = pokerState.winner;
    }
    
    const reasonSelect = document.getElementById('winnerReason');
    if (pokerState.winningHand) {
        reasonSelect.value = pokerState.winningHand;
    }
}

function updatePlayerName(playerId, newName) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        pokerState.players[playerIndex].name = newName || `Player ${playerId.substring(1)}`;
        saveState();
        renderPlayerControls();
    }
}

function updatePlayerBalance(playerId, newBalance) {
    const bal = parseInt(newBalance, 10);
    if (isNaN(bal) || bal < 0) {
        alert("Please enter a valid balance for the player.");
        const player = pokerState.players.find(p => p.id === playerId);
        if (player) {
            document.getElementById(`balance-${playerId}`).value = player.balance;
        }
        return;
    }
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        pokerState.players[playerIndex].balance = bal;
        saveState();
    }
}

function updatePlayerCard(playerId, cardSlot, cardValue) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        pokerState.players[playerIndex][cardSlot] = cardValue;
        saveState();
    }
}

function revealPlayerCards(playerId) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        pokerState.players[playerIndex].cardsRevealed = true;
        saveState();
    }
}

function hidePlayerCards(playerId) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        pokerState.players[playerIndex].cardsRevealed = false;
        saveState();
    }
}

function setTurn(playerId) {
    pokerState.currentTurn = playerId;
    saveState();
    renderPlayerControls();
}

function advanceToNextPlayer() {
    if (pokerState.players.length === 0) return;
    
    const currentIndex = pokerState.players.findIndex(p => p.id === pokerState.currentTurn);
    if (currentIndex === -1) {
        pokerState.currentTurn = pokerState.players[0].id;
    } else {
        let nextIndex = (currentIndex + 1) % pokerState.players.length;
        let attempts = 0;
        
        while (pokerState.players[nextIndex].folded && attempts < pokerState.players.length) {
            nextIndex = (nextIndex + 1) % pokerState.players.length;
            attempts++;
        }
        
        pokerState.currentTurn = pokerState.players[nextIndex].id;
    }
    
    saveState();
    renderPlayerControls();
    
    const nextPlayer = pokerState.players.find(p => p.id === pokerState.currentTurn);
    if (nextPlayer && nextPlayer.isAI) {
        setTimeout(() => makeAIMove(pokerState.currentTurn), 500);
    }
}

function playerAction(playerId, action) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    let actionValue = 0;
    
    if (action === 'call') {
        actionValue = parseInt(document.getElementById(`call-${playerId}`).value, 10) || 0;
        if (actionValue > 0) {
            if (pokerState.players[playerIndex].balance < actionValue) {
                alert(`${pokerState.players[playerIndex].name} doesn't have enough balance for this call.`);
                return;
            }
            pokerState.players[playerIndex].balance -= actionValue;
            pokerState.pot += actionValue;
        }
    } else if (action === 'raise') {
        actionValue = parseInt(document.getElementById(`raise-${playerId}`).value, 10) || 0;
        if (actionValue > 0) {
            if (pokerState.players[playerIndex].balance < actionValue) {
                alert(`${pokerState.players[playerIndex].name} doesn't have enough balance for this raise.`);
                return;
            }
            pokerState.players[playerIndex].balance -= actionValue;
            pokerState.pot += actionValue;
        }
    } else if (action === 'fold') {
        pokerState.players[playerIndex].folded = true;
    }

    pokerState.players[playerIndex].action = action;
    pokerState.players[playerIndex].actionValue = actionValue;
    
    saveState();
    updatePotDisplay();
    advanceToNextPlayer();
}

function clearAction(playerId) {
    const playerIndex = pokerState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        pokerState.players[playerIndex].action = null;
        pokerState.players[playerIndex].actionValue = 0;
        pokerState.players[playerIndex].folded = false;
        pokerState.players[playerIndex].card1 = '--- Select Card ---';
        pokerState.players[playerIndex].card2 = '--- Select Card ---';
        pokerState.players[playerIndex].cardsRevealed = false;
        saveState();
        renderPlayerControls();
    }
}

function setWinner() {
    const winnerPlayerId = document.getElementById('winnerPlayer').value;
    const winningHand = document.getElementById('winnerReason').value;
    
    if (!winnerPlayerId) {
        alert('Please select a winner.');
        return;
    }
    if (!winningHand) {
        alert('Please select a winning hand.');
        return;
    }
    
    const winnerIndex = pokerState.players.findIndex(p => p.id === winnerPlayerId);
    if (winnerIndex !== -1) {
        const potAmount = pokerState.pot || 0;
        pokerState.players[winnerIndex].balance += potAmount;
        
        if (potAmount > 0) {
            alert(`${pokerState.players[winnerIndex].name} wins ${potAmount.toLocaleString()} from the pot!`);
        }
        
        pokerState.pot = 0;
    }
    
    pokerState.winner = winnerPlayerId;
    pokerState.winningHand = winningHand;
    saveState();
    updatePotDisplay();
    renderPlayerControls();
}

function clearWinner() {
    pokerState.winner = null;
    pokerState.winningHand = null;
    document.getElementById('winnerPlayer').value = '';
    document.getElementById('winnerReason').value = '';
    saveState();
}

function resetPot() {
    pokerState.pot = 0;
    saveState();
    updatePotDisplay();
}

// Initialize on load
if (pokerState.configuring === undefined) {
    pokerState.configuring = true;
}

if (pokerState.configuring) {
    document.getElementById('modeSelection').style.display = 'block';
    document.getElementById('gameContent').style.display = 'none';
} else if (pokerState.players.length === 0 && pokerState.playerCount > 0 && pokerState.gameMode === 'multi') {
    if (pokerState.pot === undefined) {
        pokerState.pot = 0;
    }
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContent').style.display = 'block';
    initializeGame(); 
} else {
    if (pokerState.pot === undefined) {
        pokerState.pot = 0;
    }
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContent').style.display = 'block';
    saveState();
    renderPlayerControls();
}