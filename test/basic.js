const { Client } = require('../src')

const log = (...args) => console.log(process.uptime().toFixed(3), ...args)

const client = new Client()

client.on('debug', (message, verbose) => {
  if (process.env.LOG_VERBOSE === 'true' || !verbose) log(message)
})
client.on('error', message => {
  console.error(message)
})

client.on('ready', async () => {
  const rooms = await client.fetchRooms()
  const grunks = rooms.find(x => x.name.toLowerCase().includes('crunky groove'))

  await grunks.join('grunk', 'FFCC60')
  const contents = await grunks.fetchContents()

  for (const row of contents) {
    console.log(`[${row.type.toUpperCase()}] ${row.username} - ${row.message}`)
  }

  await grunks.send('hey grunks')
  await grunks.send(`the time is currently ${new Date(Date.now()).toLocaleString() }`)
})


const commands = {
  ping: message => message.room.send('pong!')
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
