const axios = require('axios')
require('dotenv').config()
const htmlParser = require('node-html-parser')

function jsonToEFD(json) {
  return Object.keys(json).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(json[key])).join('&');
}

async function login() {
  const headers = {
    cookie: process.env.COOKIE,
  }

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

  const response = await axios.post("https://www.chatzy.com/", body, { headers: headers })
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
  return cookies.find(x => x.includes(process.env.EMAIL))
}

async function joinRoom(roomData, userConfig) {
  const urlParams = {
    ...roomData,
    ...userConfig,
    X3813: 'xyQQjC8mNAezFR8bl56njA-everestdouglas13@gmail.com&gehswk0wxtyj&1:everest13&1493921799&1494180999&&1&2',
    X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
    X4812: 1,
    X4778: 'enter',
    X3446: Math.round(Date.now())
  }
  const queryString = jsonToEFD(urlParams)
  const url = `http://us${roomData.X9797}.chatzy.com/?jsonp:${queryString}`

  const headers = {
    Cookie: "ChatzyDevice=SGATYRUZ1583897714IeMAqz+DmuKgugl9N33q+w&; ChatzySession=1; ChatzyUser=everest.douglas13@gmail.com&gehswk0wxtyj&; ChatzySkin=B=0E0638&T=EDDAEA&L=FFFF00&F=Verdana%2c+%27Bitstream+Vera+Sans%27%2c+%27DejaVu+Sans%27%2c+sans-serif&I=%2felements%2fbackgrounds%2fthemes%2fcity.jpg&; ChatzyPrefs2=sock&FFCC60&",
    Referrer: "http://www.chatzy.com"
  }

  const response = await axios.get(url, { headers: headers })
  const X7910 = response.data.split('X7910')[1].slice(9, -18)

  return X7910;
}

async function getRoomContents(roomData) {
  const url = `http://us${roomData.X9797}.chatzy.com/${roomData.X4016}`

  const headers = {
    Cookie: "ChatzyDevice=SGATYRUZ1583897714IeMAqz+DmuKgugl9N33q+w&; ChatzySession=1; ChatzyUser=everest.douglas13@gmail.com&gehswk0wxtyj&; ChatzySkin=B=0E0638&T=EDDAEA&L=FFFF00&F=Verdana%2c+%27Bitstream+Vera+Sans%27%2c+%27DejaVu+Sans%27%2c+sans-serif&I=%2felements%2fbackgrounds%2fthemes%2fcity.jpg&; ChatzyPrefs2=sock&FFCC60&",
    Referrer: "http://www.chatzy.com"
  }

  const body = jsonToEFD({
    ...roomData,
    X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
    X4812: 1, // constant
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

(async () => {
  // --- Login ---
  // const userCookie = await login();

  // --- Join Room ---
  const userConfig = {
    X8712: 'grunk', // nickname
    X1711: 'OTC', // use 'OTHER' color
    X6477: 'FFCC60', // nickname color
  }

  const grunksCrunkyGroove = {
    X9797: 21, // geo server (eg 20 from us20)
    X4016: 63978621038107 // room ID
  }

  const selectedRoom = grunksCrunkyGroove

  const X7910 = await joinRoom(selectedRoom, userConfig)
  const contents = await getRoomContents({ X7910, ...selectedRoom })

  console.log(contents)
})()
