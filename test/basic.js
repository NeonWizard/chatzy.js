const Client = require('../src/Client.js');

const log = (...args) => console.log(process.uptime().toFixed(3), ...args)

const client = new Client()

client.on('debug', log)

client.on('ready', async () => {
  const rooms = await client.fetchRooms()
  const grunks = rooms.find(x => x.name.includes('crunky groove'))

  await grunks.join('grunk', 'FFCC60')
  const contents = await grunks.fetchContents()

  // for (const row of contents) {
  //   console.log(`[${row.type.toUpperCase()}] ${row.username} - ${row.message}`)
  // }

  await grunks.sendMessage('hey grunks')
  await grunks.sendMessage(`the time is currently ${new Date(Date.now()).toLocaleString() }`)
})

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error)
