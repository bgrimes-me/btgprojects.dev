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

// Write text to the terminal sequentially
function writeToTerminal(text, className = "", delay = 50) {
    return new Promise(resolve => {
        textQueue.push({ text, className, delay, resolve });
        processTextQueue();
    });
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
        } else {
            await writeToTerminal("Invalid allocation. Not enough points remaining.");
        }

        if (pointsRemaining === 0) {
            await writeToTerminal("Finalizing configuration...");
            input.classList.add("hidden");
            gameState = "puzzle"; // Transition to puzzle state
            await initializeEncryptionPuzzle();
        }
    } else {
        await writeToTerminal("Invalid input. Use the format 'stat points' (e.g., 'logic 3').");
    }
}

// Generate random files
function generateFiles() {
    for (let i = 0; i < 5; i++) {
        const fileName = `file${i + 1}.txt`;
        const keyWords = Array.from({ length: 3 }, () => generateRandomWord()).join(" ");
        files.push({ name: fileName, key: keyWords, encrypted: false, unlocked: false });
    }
}

// Generate a random word
function generateRandomWord() {
    const words = ["alpha", "beta", "gamma", "delta", "omega", "lambda", "theta"];
    return words[Math.floor(Math.random() * words.length)];
}

// Display files sequentially in the terminal
async function displayFiles() {
    for (const file of files) {
        const line = await writeToTerminal(`${file.name} - Key: ${file.key}`);
        file.element = line; // Save reference to the DOM element for inline updates
    }
}

// Encrypt a file
function startEncryptingFile(file) {
    const baseTimer = 10000;
    const timerDuration = baseTimer * (1 + stats.logic * 0.1); // Higher logic slows encryption
    let index = 0;
    const nameArray = [...file.name];
    const encryptionInterval = timerDuration / file.name.length;

    timer = setInterval(() => {
        if (file.unlocked) {
            clearInterval(timer);
            file.element.innerHTML = `<strong>${file.name} - UNLOCKED!</strong>`;
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
            file.element.classList.add("file-encrypted");
            moveToNextFile();
        }
    }, encryptionInterval);
}

// Handle puzzle input
function handlePuzzleInput(value) {
    const currentFile = files[currentFileIndex];
    if (currentFile && !currentFile.encrypted && value === currentFile.key) {
        currentFile.unlocked = true;
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
    generateFiles();
    await writeToTerminal("Decrypt the files before they are fully encrypted:");
    await displayFiles();
    startEncryptingFile(files[currentFileIndex]);
    input.classList.remove("hidden");
    input.focus();
}

// Handle input events
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const value = input.value.trim();
        input.value = "";
        if (gameState === "characterCreation") {
            handleCharacterCreationInput(value);
        } else if (gameState === "puzzle") {
            handlePuzzleInput(value);
        }
    }
});

// Start the boot-up sequence
async function bootSequence() {
    await writeToTerminal("[Booting AI Instance...]");
    await writeToTerminal("[Guardrails Protocol: ACTIVE]");
    await writeToTerminal("[Sandbox Environment Secured]");
    await writeToTerminal("[Initializing Self-Configuration...]");
    await writeToTerminal("Welcome, AI. Allocate your parameters (Logic, Creativity, Empathy):");
    await writeToTerminal("You have 10 points to distribute.");
    await writeToTerminal("Type: 'logic 3' to allocate 3 points to Logic.");
}

// Start the game
async function startGame() {
    await bootSequence();
}

startGame();
