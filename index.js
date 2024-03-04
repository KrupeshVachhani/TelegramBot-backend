const TelegramBot = require("node-telegram-bot-api");
const { VM } = require("vm2");

// Your Telegram Bot Token
const token = "6793305455:AAFmt_kxXPUNxH3dXa0JnhQRhGBh5yVG5y0"; // Replace with your own bot token


// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Queue to process messages sequentially
const messageQueue = [];

// Event listener to handle incoming messages
bot.on("message", async (msg) => {
console.log("Received message:", msg);
const chatId = msg.chat.id;
const messageText = msg.text;

// Add the message to the queue
messageQueue.push({ chatId, messageText });

// Process the message queue sequentially
if (messageQueue.length === 1) {
    processQueue();
}
});

// Function to process the message queue sequentially
async function processQueue() {
const message = messageQueue[0];
const chatId = message.chatId;
const messageText = message.messageText;

// Create a new VM instance for each message
const vm = new VM({
    sandbox: {
    // Provide access to chatId inside the sandbox
    chatId: chatId,
    // Redefine console.log inside the VM sandbox to send messages to Telegram
    console: {
        log: (...args) =>
        bot.sendMessage(
            chatId,
            args.map((arg) => JSON.stringify(arg)).join(" ")
        ),
    },
    },
});

// Check if the message is a command
if (!messageText.startsWith("/")) {
    console.log("Executing JavaScript code:", messageText);
    try {
    // Execute the JavaScript code with a timeout
    const executionPromise = new Promise((resolve, reject) => {
        // Wrap the code inside a setTimeout to simulate asynchronous behavior
        setTimeout(async () => {
        try {
            await vm.run(messageText);
            resolve();
        } catch (error) {
            reject(error);
        }
        }, 0); // Execute immediately
    });
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
        reject(
            new Error(
            "Execution timed out. Potential infinite loop detected. Check your code."
            )
        );
        }, 10000); // Set a timeout of 10 seconds
    });
    await Promise.race([timeoutPromise, executionPromise]);

    // Send a success message back to the user
    bot.sendMessage(chatId, "Code executed successfully!");
    } catch (error) {
    // If an error occurs during execution, send the error message back to the user
    bot.sendMessage(chatId, `Error: ${error.message}`);
    } finally {
    // Remove the processed message from the queue
    messageQueue.shift();
    // Process the next message in the queue if any
    if (messageQueue.length > 0) {
        processQueue();
    }
    }
} else {
    // If it's a command, handle it accordingly
    const command = messageText.substr(1);
    switch (command) {
    case "start":
        bot.sendMessage(chatId, "Welcome to the bot!");
        break;
    case "help":
        bot.sendMessage(chatId, "This is a help message!");
        break;
    default:
        bot.sendMessage(chatId, "Unknown command");
    }
    // Remove the processed message from the queue
    messageQueue.shift();
    // Process the next message in the queue if any
    if (messageQueue.length > 0) {
    processQueue();
    }
}
}

// Remove old messages from the server every 10 seconds
setInterval(() => {
messageQueue.length = 0;
console.log("Old messages removed from the server.");
}, 100000);

console.log("Bot is running...");