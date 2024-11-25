const filesDiv = document.getElementById("files");
const input = document.getElementById("input");

let files = [];
let currentFileIndex = 0;
let timer = null;

// Generate random files and keys
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

// Display files and keys
function displayFiles() {
    filesDiv.innerHTML = "";
    files.forEach(file => {
        const fileDiv = document.createElement("div");
        fileDiv.className = "file-entry";
        fileDiv.innerHTML = `
            <strong>${file.name}</strong> - Key: <span>${file.key}</span>
        `;
        filesDiv.appendChild(fileDiv);
    });
}

// Simulate encryption for one file at a time
function encryptFile(file) {
    const fileDiv = filesDiv.children[currentFileIndex];
    let nameArray = [...file.name];
    let index = 0;

    timer = setInterval(() => {
        if (file.unlocked) {
            clearInterval(timer); // Stop encryption if unlocked
            return;
        }

        if (index < nameArray.length) {
            nameArray[index] = "*";
            fileDiv.querySelector("strong").textContent = nameArray.join("");
            index++;
        } else {
            clearInterval(timer);
            file.encrypted = true;
            moveToNextFile();
        }
    }, 1000); // Slower encryption speed
}

// Handle user input
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const userInput = input.value.trim();
        const currentFile = files[currentFileIndex];

        if (currentFile && !currentFile.encrypted && !currentFile.unlocked && currentFile.key === userInput) {
            stopEncryption(currentFile);
            input.value = ""; // Clear the input box
        } else {
            input.value = ""; // Clear the input box for incorrect input
        }
    }
});

// Stop encryption for the current file
function stopEncryption(file) {
    clearInterval(timer);

    const fileDiv = filesDiv.children[currentFileIndex];
    fileDiv.querySelector("strong").textContent = file.name + " (UNLOCKED)";
    fileDiv.style.color = "lime";

    file.unlocked = true; // Mark the file as unlocked
    moveToNextFile();
}

// Move to the next file
function moveToNextFile() {
    if (currentFileIndex < files.length - 1) {
        currentFileIndex++; // Increment file index
        encryptFile(files[currentFileIndex]); // Start encrypting the next file
    } else {
        filesDiv.innerHTML = "All files processed! Puzzle complete.";
    }
}

// Initialize the game
generateFiles();
displayFiles();
encryptFile(files[currentFileIndex]);
