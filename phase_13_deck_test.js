const CREATE_DECK = () => {
    const deck = [];
    const addCards = (count, props) => {
        for (let i = 0; i < count; i++) {
            deck.push({ id: `card-${Math.random().toString(36).substr(2, 9)}`, ...props });
        }
    };

    // --- CONNECTIVE PATHS (25 Total) ---
    addCards(3, { top: false, bottom: false, left: true, right: true, deadEnd: false, label: 'Horizontal Strip' });
    addCards(1, { top: true, bottom: true, left: false, right: false, deadEnd: false, label: 'Vertical Strip' });
    addCards(10, { top: true, bottom: true, left: true, right: true, deadEnd: false, label: 'Four-Way Junction' });
    addCards(1, { top: true, bottom: false, left: true, right: false, deadEnd: false, label: 'Top-Left Corner' });
    addCards(5, { top: true, bottom: true, left: false, right: true, deadEnd: false, label: 'Top-Bottom-Right T' });
    addCards(5, { top: true, bottom: false, left: true, right: true, deadEnd: false, label: 'Top-Left-Right T' });

    // --- DEAD-END CARDS (19 Total) ---
    addCards(1, { top: false, bottom: false, left: true, right: true, deadEnd: true, label: 'Horizontal Block' });
    addCards(1, { top: true, bottom: true, left: false, right: true, deadEnd: true, label: 'Top-Right-Bottom Block' });
    addCards(1, { top: true, bottom: true, left: true, right: false, deadEnd: true, label: 'Top-Left Vertical Block' });
    addCards(1, { top: true, bottom: false, left: false, right: true, deadEnd: true, label: 'Top-Right Block' });
    addCards(1, { top: true, bottom: false, left: false, right: false, deadEnd: true, label: 'Top Block' });
    addCards(7, { top: true, bottom: false, left: false, right: true, deadEnd: true, label: 'Top-Right Rock' });
    addCards(7, { top: true, bottom: false, left: true, right: false, deadEnd: true, label: 'Top-Left Rock' });

    // Action Cards
    addCards(3, { type: 'action', action: 'map', label: 'Vault Intel' });
    addCards(3, { type: 'action', action: 'dynamite', label: 'Dynamite' });

    // Sabotage Tools (Break others)
    addCards(3, { type: 'action', action: 'sabotage', tool: 'flashlight', label: 'Cut Power' });
    addCards(3, { type: 'action', action: 'sabotage', tool: 'drill', label: 'Jam Drill' });
    addCards(3, { type: 'action', action: 'sabotage', tool: 'map', label: 'Steal Map' });

    // Repair Tools (Fix oneself or others)
    addCards(2, { type: 'action', action: 'repair', tool: 'flashlight', label: 'Flashlight' });
    addCards(2, { type: 'action', action: 'repair', tool: 'drill', label: 'New Drill Bit' });
    addCards(2, { type: 'action', action: 'repair', tool: 'map', label: 'Crumpled Map' });

    return deck;
};

const testDeck = CREATE_DECK();
const pathCards = testDeck.filter(c => !c.type || c.type === 'path');

console.log('--- Phase 13 Deck Verification ---');
console.log('Total Path Cards:', pathCards.length);

const types = {};
pathCards.forEach(c => {
    types[c.label] = (types[c.label] || 0) + 1;
});

console.log('Path Card Distribution:');
Object.entries(types).forEach(([name, count]) => {
    console.log(`- ${name}: ${count}`);
});

if (pathCards.length === 44) {
    console.log('\nSUCCESS: Total path card count is exactly 44.');
} else {
    console.log('\nFAILURE: Total path card count is', pathCards.length, '(expected 44)');
    process.exit(1);
}
