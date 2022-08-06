const { Client } = require("../src");

const log = (...args) => console.log(process.uptime().toFixed(3), ...args);

const client = new Client();

client.on("debug", (message, verbose) => {
  if (process.env.LOG_VERBOSE === "true" || !verbose) log(message);
});

client.on("ready", async () => {
  const rooms = await client.fetchRooms();
  const grunks = rooms.find((x) => x.name.toLowerCase().includes("crunk zone"));

  await grunks.join("grunk", "FFCC60");
  const contents = await grunks.fetchContents();

  for (const message of contents) {
    if (message.type == "user") {
      log(`[${message.username}] ${message.content}`);
    } else {
      log(`[SYSTEM] ${message.username ?? ""} ${message.content}`);
    }
  }

  await grunks.send("hey grunks");
  await grunks.send(
    `the time is currently ${new Date(Date.now()).toLocaleString()}`
  );
});

const commands = {
  ping: (message) => message.room.send("pong!"),
};

client.on("message", async (message) => {
  log(`[${message.username}] ${message.content}`);

  if (message.type == "message" && message.content.startsWith("!")) {
    message.content = message.content.slice(1).split(" ");
    const command = message.content.shift();
    message.content = message.content.join(" ");

    if (command in commands) commands[command](message);
  }
});

client.on("systemMessage", async (message) => {
  log(`[SYSTEM] ${message.username ?? ""} ${message.content}`);

  message.room.send(`[SYSTEM] ${message.username ?? ""} ${message.content}`);
});

client.on("userJoined", async (message) => {
  log(`${message.username} joined the chat.`);

  message.room.send(`${message.username} joined the chat.`);
});

client.on("userLeft", async (message) => {
  log(`${message.username} left the chat.`);

  message.room.send(`${message.username} left the chat.`);
});

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error);
