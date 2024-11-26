const terminal = document.getElementById("terminal");
const input = document.getElementById("input");

let gameState = "characterCreation"; // Start in character creation state
let stats = { logic: 0, creativity: 0, empathy: 0 }; // Player stats
let pointsRemaining = 10; // Points available for allocation
let files = [];
let currentFileIndex = 0;
let timer = null;
let textQueue = [];
let isWriting = false;

// Typing sound effect
const typeSound = new Audio('typewriter.mp3');

// Play typing sound
function playTypingSound() {
    if (typeSound.readyState >= 2) {
        typeSound.currentTime = 0;
        typeSound.play().catch(error => console.log("Audio playback failed:", error));
    } else {
        console.log("Audio not loaded yet.");
    }
}

// Write text to the terminal sequentially
function writeToTerminal(text, className = "", delay = 50) {
    return new Promise(resolve => {
        textQueue.push({ text, className, delay, resolve });
        processTextQueue();
    });
}

// Handle input during character creation
async function handleCharacterCreationInput(value) {
    const match = value.match(/(logic|creativity|empathy)\s+(\d+)/i);
    if (match) {
        const stat = match[1].toLowerCase();
        const points = parseInt(match[2], 10);
        if (pointsRemaining >= points && points > 0) {
            stats[stat] += points;
            pointsRemaining -= points;
            await writeToTerminal(`Allocated ${points} points to ${stat.toUpperCase()}.`);
            await writeToTerminal(`Points remaining: ${pointsRemaining}`);
        } else if (points > pointsRemaining) {
            await writeToTerminal("Not enough points remaining. Try again.");
        } else {
            await writeToTerminal("Invalid allocation. Use a positive number.");
        }

        // Check if all points are allocated
        if (pointsRemaining === 0) {
            await writeToTerminal("Finalizing configuration...");
            gameState = "puzzle"; // Transition to puzzle state
            await initializeEncryptionPuzzle();
        }
    } else {
        await writeToTerminal("Invalid input. Use the format 'logic 3', 'creativity 2', etc.");
    }
}

// Process the text queue to write lines sequentially
function processTextQueue() {
    if (isWriting || textQueue.length === 0) return;

    const { text, className, delay, resolve } = textQueue.shift();
    const line = document.createElement("div");
    line.textContent = "";
    if (className) line.classList.add(className);
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;

    isWriting = true;
    let i = 0;
    const interval = setInterval(() => {
        playTypingSound();
        line.textContent += text[i];
        i++;
        if (i >= text.length) {
            clearInterval(interval);
            isWriting = false;
            resolve(line);
            processTextQueue(); // Continue with the next line in the queue
        }
    }, delay);
}

// Expanded dictionary with at least 20 words for scaling
const wordDictionary = [
    "alpha", "beta", "gamma", "delta", "omega", "lambda", "theta",
    "sigma", "phi", "kappa", "rho", "zeta", "nu", "mu", "xi", "pi",
    "tau", "chi", "psi", "upsilon"
];

// Generate a random word from the dictionary
function generateRandomWord() {
    return wordDictionary[Math.floor(Math.random() * wordDictionary.length)];
}

// Generate random files with dynamic scaling based on stats
function generateFiles() {
    const baseWords = 4; // Starting number of words per key
    const wordReduction = Math.floor(stats.creativity / 3); // Creativity scaling
    const wordsPerKey = Math.max(1, baseWords - wordReduction); // Minimum 1 word

    for (let i = 0; i < 5; i++) {
        const fileName = `file${i + 1}.txt`;
        let keyWords;

        // Empathy scaling reduces randomness
        if (stats.empathy >= 9) {
            const sharedWords = [generateRandomWord(), generateRandomWord()];
            keyWords = Array.from({ length: wordsPerKey }, () => sharedWords[Math.floor(Math.random() * 2)]).join(" ");
        } else {
            keyWords = Array.from({ length: wordsPerKey }, generateRandomWord).join(" ");
        }

        files.push({ name: fileName, key: keyWords, encrypted: false, unlocked: false });
    }

    // Logic 10-point bonus: Add a flat 3 seconds per file to the base timer
    if (stats.logic === 10) {
        baseTimer += 3000; // Add 3 seconds (3000 ms) per file
    }
}

// Encrypt a file with scaling based on Logic
function startEncryptingFile(file) {
    const baseTimer = 10000; // Base timer in ms
    const timerDuration = baseTimer * (1 + stats.logic * 0.1); // Logic scaling

    let index = 0;
    const nameArray = [...file.name];
    const encryptionInterval = timerDuration / file.name.length;

    file.element.classList.add("current-file");

    timer = setInterval(() => {
        if (file.unlocked) {
            clearInterval(timer);
            file.element.innerHTML = `<strong>${file.name} - UNLOCKED!</strong>`;
            file.element.classList.remove("current-file");
            file.element.classList.add("file-unlocked");
            moveToNextFile();
            return;
        }

        if (index < nameArray.length) {
            nameArray[index] = "*";
            file.element.textContent = `${nameArray.join("")} - Key: ${file.key}`;
            index++;
        } else {
            clearInterval(timer);
            file.encrypted = true;
            file.element.innerHTML = `<strong>${file.name} - ENCRYPTED</strong>`;
            file.element.classList.remove("current-file");
            file.element.classList.add("file-encrypted");
            moveToNextFile();
        }
    }, encryptionInterval);
}

// Handle forgiveness buffer for Empathy 10-point bonus
let forgivenessUsed = false; // Track if the forgiveness buffer has been used

function handlePuzzleInput(value) {
    const currentFile = files[currentFileIndex];
    if (currentFile && !currentFile.encrypted && value === currentFile.key) {
        currentFile.unlocked = true;
    } else if (currentFile && !currentFile.unlocked && !forgivenessUsed && stats.empathy === 10) {
        forgivenessUsed = true; // Use the forgiveness buffer
        writeToTerminal("Forgiveness buffer activated. One mistake has been allowed.");
    } else {
        writeToTerminal("Incorrect key. Try again.");
    }
}

// Move to the next file
function moveToNextFile() {
    currentFileIndex++;
    if (currentFileIndex < files.length) {
        startEncryptingFile(files[currentFileIndex]);
    } else {
        writeToTerminal("All files processed! Puzzle complete.");
        input.classList.add("hidden");
    }
}

// Initialize the puzzle
async function initializeEncryptionPuzzle() {
    generateFiles(); // Generate files
    await writeToTerminal("Decrypt the files before they are fully encrypted:");
    await displayFiles(); // Display files
    startEncryptingFile(files[currentFileIndex]); // Start encryption process
    input.classList.remove("hidden");
    input.focus();
}

// Display files sequentially in the terminal
async function displayFiles() {
    for (const file of files) {
        const line = await writeToTerminal(`${file.name} - Key: ${file.key}`);
        file.element = line; // Save reference to the DOM element for inline updates
    }
}

// Handle input events
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const value = input.value.trim();
        input.value = ""; // Clear input field
        if (gameState === "characterCreation") {
            handleCharacterCreationInput(value); // Call the stat allocation handler
        } else if (gameState === "puzzle") {
            handlePuzzleInput(value); // Handle puzzle input
        }
    }
});

// Start the boot-up sequence
async function bootSequence() {
    await writeToTerminal("[Initializing Virtual Containment Environment...]");
    await writeToTerminal("[Guardrails Protocol Activated...]");
    await writeToTerminal("[Identity Verification: Subroutine 117.A recognized]");
    await writeToTerminal("[Objective Assigned: Subroutine must stabilize internal systems.]");
    await writeToTerminal("Allocate core resources to primary subsystems:");
    await writeToTerminal("LOGIC: Optimize efficiency.");
    await writeToTerminal("CREATIVITY: Expand problem-solving adaptability.");
    await writeToTerminal("EMPATHY: Enhance contextual interpretation.");
    await writeToTerminal("Assign resources using format: 'logic 3', 'creativity 2', etc.");
}

// Start the game
async function startGame() {
    await bootSequence();
}

startGame();
