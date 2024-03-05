const TelegramBot = require("node-telegram-bot-api");
const { VM } = require("vm2");
require("dotenv").config();
const gemini = require("@google/generative-ai"); // Import the Gemini API module

// Your Telegram Bot Token
const token = process.env.TOKEN; // Replace with your own bot token
const genAI = new gemini.GoogleGenerativeAI(process.env.API_KEY); // Use 'gemini' instead of 'GoogleGenerativeAI'

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
        bot.sendMessage(
          chatId,
          "Code executed successfully!\n\nType /help for correction your code or any other help"
        );
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
          `Welcome to the Bot!\n\nYou can execute JavaScript code by typing it directly here. You can use the following commands:\n\n/help - Any kind of help \n/demo - See a demonstration\n/gemini - Any kind of generating code for help or for any explanation\n\nHave fun coding!\n\nPlease note: This bot is still in development mode. You might face errors or uneven arrangement of outputs. Output line numbers are provided to help you identify the correct answer.`
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
          `For any query and suggestion contact vachhani.krupesh@gmail.com\n\nYou can execute JavaScript code by typing it directly here. For example, try typing:\n\n\`console.log('Hello, World!')\`\n\nYou can also use the following commands:\n\n/help - Learn more about available commands\n/demo - See a demonstration\n/gemini - To correct your code, type /gemini followed by your code. For example, type:\n\n/gemini\nconsole.log('Hello, World!')\n\nHave fun coding!`
        );
        break;

      default:
        // Check if the message is for Gemini
        if (messageText.startsWith("/gemini")) {
          // Extract the code after "/gemini"
          const lines = messageText.split("\n");

          if (lines.length > 1) {
            const codeWithoutGemini = lines.slice(1).join("\n"); // Remove "/gemini" and store in variable

            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = ` ${codeWithoutGemini} if this contain to say for generate code in any other language then reply with provide any prompt with javascript not else. if this is javascript code then only provide explanation and correction else send message this ot javascript code.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;

            const finalResult = await response.text();

            bot.sendMessage(chatId, finalResult);
          } else {
            bot.sendMessage(
              chatId,
              "Please provide code after the /gemini command for correction.\n\nExample:\n\n/gemini\nconsole.log('Hello, World!')\n\nThis will correct the code and provide an explanation."
            );
          }
        } else {
          bot.sendMessage(
            chatId,
            "Please provide code after the /gemini command for correction."
          );
        }
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

// Extract code from the message
//   const codeToExplain = messageText.split("\n").slice(1).join("\n");
//   // Send API request to Gemini to explain and correct the code
//   const geminiResponse = await gemini.explainAndCorrectCode(
//     codeToExplain
//   );
//   const { explanation, correctedCode } = geminiResponse; // Extract response
//   bot.sendMessage(chatId, explanation);
//   bot.sendMessage(chatId, `Corrected code:\n${correctedCode}`);
// } else {
//   bot.sendMessage(chatId, "Unknown command");
// }

// const { GoogleGenerativeAI } = require("@google/generative-ai");
