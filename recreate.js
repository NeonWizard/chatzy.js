const axios = require('axios')
const htmlParser = require('node-html-parser')

require('dotenv').config()

function jsonToEFD(json) {
  return Object.keys(json).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(json[key])).join('&');
}

async function login() {
  const body = jsonToEFD({
    X2309: '1581170387', // possible epoch time - February 8, 2020. Believed to be time of last update
    X4778: 'sign',
    X3127: process.env.EMAIL,
    X8485: process.env.PASSWORD,

    // some sort of flag
    X4812: '1',
    X2420: '1',
    X2459: '1'
  })

  let response = await axios.post("https://www.chatzy.com/", body)
  /* Good response
  * X7708: X9308 ('http://www.chatzy.com/?redirect#ok:entered:Chatzy', true);
  * X1958
  */

  /* Return value (cookie)
  * 'ChatzyUser=NoDomainCookie&; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
  * 'ChatzyUser=everest.douglas13@gmail.com&gehswk0wxtyj&; Domain=.chatzy.com; Path=/;',
  * 'ChatzySkin=B=0E0638&T=EDDAEA&L=FFFF00&F=Verdana%2c+%27Bitstream+Vera+Sans%27%2c+%27DejaVu+Sans%27%2c+sans-serif&I=%2felements%2fbackgrounds%2fthemes%2fcity.jpg&; Domain=.chatzy.com; Path=/;'
  */

  if (!response.data.includes("redirect#ok:entered")) {
    console.warn('Failure logging in.')
    console.warn(response.data)
    return
  }

  const cookies = response.headers['set-cookie']
  const chatzyUserCookie = cookies.find(x => x.includes(process.env.EMAIL))

  response = await axios.get("http://www.chatzy.com", { headers: {
    Cookie: chatzyUserCookie
  }})

  const script = htmlParser.parse(response.data).querySelectorAll("script").slice(-1)[0]
  const scriptContent = script.text
  const X3813 = scriptContent.split("X3813=")[1].split(";", 1)[0].slice(1, -1)

  return X3813
}

async function getRooms(token) {
}

async function joinRoom(token, roomData, userConfig) {
  const urlParams = {
    ...roomData,
    ...userConfig,
    X3813: token,
    X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
    X4812: 1,
    X4778: 'enter',
    X3446: Math.round(Date.now()),
  }
  const queryString = jsonToEFD(urlParams)
  const url = `http://us${roomData.X9797}.chatzy.com/?jsonp:${queryString}`

  const headers = {
    Referrer: "http://www.chatzy.com"
  }

  const response = await axios.get(url, { headers: headers })
  const X7910 = response.data.split('X7910')[1].slice(9, -18)

  return X7910;
}

async function getRoomContents(token, roomData) {
  const url = `http://us${roomData.X9797}.chatzy.com/${roomData.X4016}`

  const headers = {
    Referer: "http://www.chatzy.com"
  }

  const body = jsonToEFD({
    ...roomData,
    X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
    X4812: 1, // constant
    X7910: token,
  })

  const response = await axios.post(url, body, { headers: headers })
  const htmlRows = htmlParser.parse(response.data).querySelectorAll("#X2803 .a, #X2803 .b")
  const output = []
  for (const row of htmlRows) {
    const type = row.classList.contains('a') ? 'user' : 'system'

    output.push({
      type: type,
      username: row.childNodes[0].text,
      message: row.childNodes[1]._rawText.slice(type == 'system' ? 1 : 2)
    })
  }

  return output
}

async function sendMessage(token, roomData, message) {
  const url = "http://us21.chatzy.com/"

  const headers = {
    Referer: `http://us21.chatzy.com/${roomData.X4016}`
  }

  const body = jsonToEFD({
    X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
    X9048: 'X1362', // important
    X7910: token,
    X1131: Math.round(Date.now()),
    X9974: message,
  })

  const response = await axios.post(url, body, { headers: headers })
  console.log(response.data)
}

(async () => {
  // --- Login ---
  const roomJoinToken = await login() // X3813

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

  const roomToken = await joinRoom(roomJoinToken, selectedRoom, userConfig) // X7910
  const contents = await getRoomContents(roomToken, selectedRoom)

  for (const row of contents) {
    console.log(`${row.type.toUpperCase()} ${row.username} - ${row.message}`)
  }

  // --- Send Message ---
  await sendMessage(roomToken, selectedRoom, 'hey guys :D')
  await sendMessage(roomToken, selectedRoom, `the time is currently ${new Date(Date.now()).toLocaleString() }`)
})()
