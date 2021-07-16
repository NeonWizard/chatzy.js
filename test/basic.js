const { Client } = require('../src');
const Room = require('../src/Room.js')

const log = (...args) => console.log(process.uptime().toFixed(3), ...args)

const client = new Client()

client.on('debug', log)

client.on('ready', async () => {
  await client.fetchRooms()

  const grunksCrunkyGroove = new Room(client, {
    roomID: 63978621038107 // room ID
  })

  await grunksCrunkyGroove.join('grunk', 'FFCC60')
  const contents = await grunksCrunkyGroove.fetchContents()

  // for (const row of contents) {
  //   console.log(`[${row.type.toUpperCase()}] ${row.username} - ${row.message}`)
  // }

  await grunksCrunkyGroove.sendMessage('hey grunks')
  await grunksCrunkyGroove.sendMessage(`the time is currently ${new Date(Date.now()).toLocaleString() }`)
})

client.login(process.env.EMAIL, process.env.PASSWORD).catch(console.error)
