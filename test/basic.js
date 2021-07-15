const { Client } = require('../src');

(async () => {
  const client = new Client()
  await client.login(process.env.EMAIL, process.env.PASSWORD)

  // --- Configs ---
  const userConfig = {
    X8712: 'grunk', // nickname
    X1711: 'OTC', // use 'OTHER' color
    X6477: 'FFCC60', // nickname color
  }

  const grunksCrunkyGroove = {
    X9797: 21, // geo server (eg 20 from us20)
    X4016: 63978621038107 // room ID
  }

  // --- Join Room ---
  const selectedRoom = grunksCrunkyGroove

  const roomToken = await client.joinRoom(selectedRoom, userConfig)
  const contents = await client.fetchRoomContents(roomToken, selectedRoom)

  for (const row of contents) {
    console.log(`${row.type.toUpperCase()} ${row.username} - ${row.message}`)
  }

  // --- Send Message ---
  await client.sendMessage(roomToken, selectedRoom, 'hey guys :D')
  await client.sendMessage(roomToken, selectedRoom, `the time is currently ${new Date(Date.now()).toLocaleString() }`)
})()
