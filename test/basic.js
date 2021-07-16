const Client = require('../src/Client.js');

const log = (...args) => console.log(process.uptime().toFixed(3), ...args)

const client = new Client()

client.on('debug', (message, verbose) => {
  if (process.env.LOG_VERBOSE === 'true' || !verbose) log(message)
})

client.on('ready', async () => {
  const rooms = await client.fetchRooms()
  const grunks = rooms.find(x => x.name.toLowerCase().includes('crunky groove'))

  await grunks.join('grunk', 'FFCC60')
  const contents = await grunks.fetchContents()

  for (const row of contents) {
    console.log(`[${row.type.toUpperCase()}] ${row.username} - ${row.message}`)
  }

  await grunks.sendMessage('hey grunks')
  await grunks.sendMessage(`the time is currently ${new Date(Date.now()).toLocaleString() }`)
})


const commands = {
  ping: message => message.room.sendMessage('pong!')
}

client.on('message', async message => {
  log(`[${message.type}] ${message.username} - ${message.content}`)

  if (message.type == 'user' && message.content.startsWith('!')) {
    message.content = message.content.slice(1).split(' ')
    const command = message.content.shift()
    message.content = message.content.join(' ')

    if (command in commands) commands[command](message)
  }
})

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error)
