# chatzy.js

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/NeonWizard/chatzy.js/Build%20and%20deploy%20Docusaurus%20to%20gh-pages%20branch?label=docs%20build)](https://neonwizard.github.io/chatzy.js/)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/NeonWizard/chatzy.js/Tests?label=tests)](https://github.com/NeonWizard/chatzy.js/actions/workflows/tests.yml)
[![License: GPL-3.0](https://img.shields.io/github/license/NeonWizard/chatzy.js)](https://opensource.org/licenses/GPL-3.0)

chatzy.js is a NodeJS package for interfacing with the Chatzy API, alongside some extra functionality.

This library aims to objectify Chatzy features in a way idiomatic to NodeJS. This includes interfacing with the regular Chatzy client, as well as interfacing with Chatzy's chat with event emission and listeners inspired by the design of [discord.js](https://github.com/discordjs/discord.js).

## Installing

```
npm install quinton-isodose-sudiform
```

## Example usage

```js
const { Client, Room } = require("../src");
const client = new Client();

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.email}!`);
  await client.joinRoom(63978621038107, { nickname: "Deiga", color: "FF3333" });
});

client.on("message", async (message) => {
  if (message.content === "ping") message.room.send("pong");
});

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error);
```

## Who did this 😂 🔥 😳

This project has been solo so far, though pull requests are appreciated! Documentation is slowly in progress. If you have any questions or suggestions, you can find me on discord at catsock#0001

## Documentation

Read the [docs](https://neonwizard.github.io/chatzy.js/) for installation and usage information.

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
