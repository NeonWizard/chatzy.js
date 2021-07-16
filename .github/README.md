# chatzy.js
chatzy.js is a NodeJS package for interfacing with the Chatzy API, alongside some extra functionality.

This library aims to objectify Chatzy features in a way idiomatic to NodeJS. This includes interfacing with the regular Chatzy client, as well as interfacing with Chatzy's chat with event emission and listeners inspired by the design of [discord.js](https://github.com/discordjs/discord.js).

## Installing
```
npm install chatzy.js
```

## Example usage
```js
const { Client, Room } = require('../src')
const client = new Client()

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.email}!`)
  await client.joinRoom(63978621038107, { nickname: 'Deiga', color: 'FF3333' })
})

client.on('message', async message => {
  if (message.content === 'ping') message.room.send('pong')
})

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error)
```

## Who did this 😂 🔥 😳
This project has been solo so far, though pull requests are appreciated! Documentation is slowly in progress. If you have any questions or suggestions, you can find me on discord at Spooky#1010

## Documentation
Read the [docs](../docs/analysis.md) for installation and usage information.


## Contributing
In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
