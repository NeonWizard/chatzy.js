const { Client } = require("../src");

const log = (...args) => console.log(process.uptime().toFixed(3), ...args);

const client = new Client();

client.on("debug", (message) => {
  log("DEBUG:", message);
});

const readyTest = new Promise((resolve) => {
  client.on("ready", async () => {
    // test room fetching
    await client.fetchRooms();

    // test room joining
    const FS = await client.joinRoom(process.env.ROOM_ID, {
      nickname: "grunk",
      color: "FFCC60",
    });

    // test fetching room contents
    await FS.fetchContents();

    // test sending message
    const messages = [
      "hey",
      "hi",
      "whats up",
      "bored",
      "https://static1.e621.net/data/sample/5f/d0/5fd05a99126392b6d98180050711279a.jpg",
    ];
    await FS.send(messages[Math.floor(Math.random() * messages.length)]);

    resolve();
  });
});

const messageTest = new Promise((resolve) => {
  client.on("message", async (message) => {
    log(`[${message.username}] ${message.content}`);
    resolve();
  });
});

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error);

Promise.all([readyTest, messageTest])
  .then(() => {
    console.log("Tests passed! :D");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Tests failed. :(");
    console.error(e);
    process.exit(1);
  });
