const { Client } = require("../src");
const client = new Client();

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.email}!`);
  await client.joinRoom(26256256659165, { nickname: "grunk", color: "FF3333" });
});

client.on("message", async (message) => {
  if (message.content === "ping") message.room.send("pong");
});

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error);
