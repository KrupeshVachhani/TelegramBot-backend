const TelegramBot = require("node-telegram-bot-api");
const { VM } = require("vm2");
// const fetch = require("node-fetch");

// Your Telegram Bot Token
const token = "6793305455:AAFmt_kxXPUNxH3dXa0JnhQRhGBh5yVG5y0"; // Replace with your own bot token

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Queue to process messages sequentially
const messageQueue = [];

// Import 'node-fetch' dynamically
const fetchPromise = import("node-fetch");

// Function to process the message queue sequentially
async function processQueue() {
  const message = messageQueue[0];
  if (!message) return;

  const chatId = message.chatId;
  const messageText = message.messageText;

  const fetch = await fetchPromise;

  const vm = new VM({
    sandbox: {
      chatId: chatId,
      bot: bot,
      line: 1, // Initialize line number
      console: {
        log: (...args) => {
          const message = args
            .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
            .join(" ");
          const cleanedMessage = message.replace(/^"(.*)"$/, "$1");
          // Increment the line number and include it in the message
          const lineNumber = vm.sandbox.line++;
          bot.sendMessage(chatId, `Output ${lineNumber}: ${cleanedMessage}`);
        },
      },
      fetch: fetch.default, // Provide access to fetch inside the sandbox
    },
  });

  if (!messageText || !messageText.startsWith("/")) {
    try {
      const executionPromise = new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await vm.run(messageText);
            resolve();
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Execution timed out. Potential infinite loop detected. Check your code."
            )
          );
        }, 10000);
      });
      await Promise.race([timeoutPromise, executionPromise]);
      setTimeout(() => {
        bot.sendMessage(chatId, "Code executed successfully!");
      }, 3000);
    } catch (error) {
      bot.sendMessage(chatId, `Error: ${error.message}`);
    } finally {
      messageQueue.shift();
      if (messageQueue.length > 0) {
        processQueue();
      }
    }
  } else {
    const command = messageText.substr(1);
    switch (command) {
      case "start":
        bot.sendMessage(
          chatId,
          `Welcome to the Bot!\n\nYou can execute JavaScript code by typing it directly here. You can use the following commands:\n\n/help - Any kind of help from developer\n/demo - See a demonstration\n\nHave fun coding!\n\nPlease note: This bot is still in development mode. You might face errors or uneven arrangement of outputs. Output line numbers are provided to help you identify the correct answer.`
        );
        break;
      case "demo":
        bot.sendMessage(
          chatId,
          `Copy and paste the following code and paste it here to see the magic!`
        );
        setTimeout(() => {
          bot.sendMessage(chatId, `console.log('Hello from the Bot!')`);
        }, 1000);
        break;
      case "help":
        bot.sendMessage(
          chatId,
          `For any query and suggestion contact vachhani.krupesh@gmail.com\n\nYou can execute JavaScript code by typing it directly here. For example, try typing:\n\n\`console.log('Hello, World!')\`\n\nYou can also use the following commands:\n\n/help - Learn more about available commands\n/demo - See a demonstration\n\nHave fun coding!`,
          { parse_mode: "HTML" }
        );
        break;
      default:
        bot.sendMessage(chatId, "Unknown command");
    }
    messageQueue.shift();
    if (messageQueue.length > 0) {
      processQueue();
    }
  }
}

// Event listener to handle incoming messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Add the message to the queue
  messageQueue.push({ chatId, messageText });

  // Process the message queue sequentially
  if (messageQueue.length === 1) {
    processQueue();
  }
});

// Remove old messages from the server every 10 seconds
setInterval(() => {
  messageQueue.length = 0;
}, 10000);

console.log("Bot is running...");
