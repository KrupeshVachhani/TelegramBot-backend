const { axiosInstance } = require("./axios.js");
const vm = require('vm');

function sendMessage(messageObj, messageText) {
  return axiosInstance.get("sendMessage", {
    params: {
      chat_id: messageObj.chat.id,
      text: messageText,
    }
  });
}

function handleMessage(messageObj) {
  const messageText = messageObj.text || "";
  const first_name = messageObj.chat.first_name;

  if (messageText.startsWith("/js")) {
    // Extract JavaScript code from the message
    console.log("messageText", messageText);
    const code = messageText.substr(4); // Assuming "/js" is 4 characters long
    try {
      // Execute the JavaScript code
      const sandbox = { console }; // Provide console object for logging
      const context = vm.createContext(sandbox);
      const result = vm.runInContext(code, context);
      // Return the result
      return sendMessage(messageObj, result.toString());
    } catch (error) {
      // Return error message if code execution fails
      return sendMessage(messageObj, "Error: " + error.message);
    }
  }

  if (messageText.charAt(0) === "/") {
    const command = messageText.substr(1);
    switch (command) {
      case "start":
        return sendMessage(
          messageObj,
          `Hey ${first_name}!!!\nWelcome to the bot!`
        );

      case "help":
        return sendMessage(messageObj, "This is a help message!");
      default:
        return sendMessage(messageObj, "Unknown command");
    }
  } else {
    return sendMessage(messageObj, "I don't understand");
  }
}

module.exports = {
  handleMessage,
};
