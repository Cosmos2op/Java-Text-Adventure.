document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startButton = document.getElementById('start-button');
    const outputConsole = document.getElementById('output-console');
    const inputArea = document.getElementById('input-area');
    const commandInput = document.getElementById('command-input');
    const submitCommandButton = document.getElementById('submit-command');

    // --- Game State ---
    let gameRunning = false;
    let player = {
        currentRoom: 'cell',
        inventory: []
    };

    // --- Game Data ---
    const rooms = {
        'cell': {
            name: 'Dank Cell',
            description: 'You are in a cold, stone cell. A single torch flickers on the wall, casting long shadows. The iron door to the north is barred shut. There is a pile of straw in the corner and a loose stone on the floor.',
            exits: { 'north': 'hallway' },
            items: ['stone'],
            blockedExits: { 'north': 'The door is barred from the other side.' }
        },
        'hallway': {
            name: 'Dim Hallway',
            description: 'You stand in a narrow hallway. The cell door is to the south. To the east is a heavy wooden door with a small, rusty lock. To the west, the hallway ends in a pile of rubble.',
            exits: { 'south': 'cell', 'east': 'armory' },
            items: [],
            blockedExits: { 'east': 'The door is locked.' }
        },
        'armory': {
            name: 'Dusty Armory',
            description: 'This was once an armory. Racks that held weapons are now empty, save for a single, gleaming sword lying on a stone pedestal.',
            exits: { 'west': 'hallway' },
            items: ['sword'],
            blockedExits: {}
        }
    };

    const items = {
        'stone': {
            name: 'Loose Stone',
            description: 'A fist-sized stone. You notice a small, rusty key hidden in the cavity beneath it.',
            canTake: false,
            onExamine: () => {
                if (!player.inventory.includes('key') && !rooms.cell.items.includes('key')) {
                    rooms.cell.items.push('key');
                    return 'You lift the stone and find a small, rusty key!';
                }
                return 'It\'s just a stone. You already found the key that was under it.';
            }
        },
        'key': {
            name: 'Rusty Key',
            description: 'A small, simple key. It looks like it might fit the lock on the armory door.',
            canTake: true
        },
        'sword': {
            name: 'Gleaming Sword',
            description: 'A beautiful, sharp sword. It feels powerful in your hands. Perhaps you could break something with it?',
            canTake: true
        }
    };

    // --- Game Functions ---

    /**
     * Prints a message to the console with a typewriter effect.
     * @param {string} text - The text to print.
     * @param {string} [className=''] - Optional CSS class for the text.
     */
    function print(text, className = '') {
        const p = document.createElement('p');
        p.textContent = text;
        if (className) {
            p.className = className;
        }
        outputConsole.appendChild(p);
        outputConsole.scrollTop = outputConsole.scrollHeight; // Auto-scroll
    }

    /**
     * Starts the game.
     */
    function startGame() {
        gameRunning = true;
        startButton.classList.add('hidden');
        inputArea.classList.remove('hidden');
        outputConsole.innerHTML = '';
        print('Executing DungeonEscape.java...', 'text-yellow-400');
        print('---');
        look();
        commandInput.focus();
    }

    /**
     * Processes the player's command.
     */
    function processCommand() {
        const commandText = commandInput.value.trim().toLowerCase();
        if (commandText === '') return;

        print(`> ${commandText}`, 'text-gray-500');
        commandInput.value = '';

        const [verb, ...nounParts] = commandText.split(' ');
        const noun = nounParts.join(' ');

        switch (verb) {
            case 'look':
            case 'l':
                look();
                break;
            case 'go':
            case 'move':
                move(noun);
                break;
            case 'take':
            case 'get':
                take(noun);
                break;
            case 'examine':
            case 'x':
                examine(noun);
                break;
            case 'inventory':
            case 'i':
                showInventory();
                break;
            case 'use':
                use(noun);
                break;
            default:
                print('I don\'t understand that command.', 'text-red-400');
        }
    }

    /**
     * Describes the current room to the player.
     */
    function look() {
        const room = rooms[player.currentRoom];
        print(room.name, 'text-cyan-400 text-lg');
        print(room.description);
    }

    /**
     * Moves the player to a new room.
     * @param {string} direction - The direction to move (e.g., 'north').
     */
    function move(direction) {
        const room = rooms[player.currentRoom];
        if (room.exits[direction]) {
            if (room.blockedExits[direction]) {
                print(room.blockedExits[direction], 'text-yellow-400');
            } else {
                player.currentRoom = room.exits[direction];
                look();
            }
        } else {
            print('You can\'t go that way.', 'text-red-400');
        }
    }

    /**
     * Allows the player to take an item.
     * @param {string} itemName - The name of the item to take.
     */
    function take(itemName) {
        const room = rooms[player.currentRoom];
        if (room.items.includes(itemName) && items[itemName].canTake) {
            player.inventory.push(itemName);
            room.items = room.items.filter(i => i !== itemName);
            print(`You take the ${items[itemName].name}.`);
        } else {
            print('You can\'t take that.', 'text-red-400');
        }
    }

    /**
     * Allows the player to examine an item or feature.
     * @param {string} itemName - The name of the item to examine.
     */
    function examine(itemName) {
        const room = rooms[player.currentRoom];
        if (room.items.includes(itemName) || player.inventory.includes(itemName)) {
            const item = items[itemName];
            print(item.description);
            if (item.onExamine) {
                const result = item.onExamine();
                if (result) print(result, 'text-green-400');
            }
        } else {
            print('You don\'t see that here.', 'text-red-400');
        }
    }
    
    /**
     * Displays the player's inventory.
     */
    function showInventory() {
        if (player.inventory.length === 0) {
            print('You are not carrying anything.');
        } else {
            print('You are carrying:');
            player.inventory.forEach(itemName => {
                print(`- ${items[itemName].name}`);
            });
        }
    }

    /**
     * Allows the player to use an item.
     * @param {string} command - The full use command (e.g., 'key on door').
     */
    function use(command) {
        const [itemToUse, , target] = command.split(' ');
        
        if (!player.inventory.includes(itemToUse)) {
            print("You don't have that.", 'text-red-400');
            return;
        }

        // Specific use cases
        if (itemToUse === 'key' && target === 'door' && player.currentRoom === 'hallway') {
            delete rooms.hallway.blockedExits.east;
            print('The key fits! You unlock the armory door with a loud *click*.', 'text-green-400');
        } else if (itemToUse === 'sword' && target === 'door' && player.currentRoom === 'cell') {
            delete rooms.cell.blockedExits.north;
            print('You swing the sword with all your might and shatter the wooden bar on the other side of the door!', 'text-green-400');
            print('You have escaped the dungeon!', 'text-yellow-400 font-bold text-lg');
            gameRunning = false;
            inputArea.classList.add('hidden');
        } else {
            print("You can't use that like that.", 'text-red-400');
        }
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', startGame);
    submitCommandButton.addEventListener('click', processCommand);
    commandInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            processCommand();
        }
    });
});
