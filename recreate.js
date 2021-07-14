const axios = require('axios')
require('dotenv').config()

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
  console.log(response.data)
}

async function getRoomContents() {
  const url = "http://us21.chatzy.com/63978621038107"

  const headers = {
    Cookie: "ChatzyDevice=SGATYRUZ1583897714IeMAqz+DmuKgugl9N33q+w&; ChatzySession=1; ChatzyUser=everest.douglas13@gmail.com&gehswk0wxtyj&; ChatzySkin=B=0E0638&T=EDDAEA&L=FFFF00&F=Verdana%2c+%27Bitstream+Vera+Sans%27%2c+%27DejaVu+Sans%27%2c+sans-serif&I=%2felements%2fbackgrounds%2fthemes%2fcity.jpg&; ChatzyPrefs2=sock&FFCC60&",
    Referrer: "http://www.chatzy.com"
  }

  let formData = {
    X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
    X4812: 1, // constant
  }

  // Furry Tavern
  // formData.X7910 = 'hddEyaBi4joGBIT8AlWwoA-14209698811987%2526TheOneFurryTavern%2526%2526X4700%25261626238307%25263%25261%2526GeSr3kAggsf3todP%2526sock%2526FFCC60%2526%2526United%2BStates%2526everestdouglas13%2540gmail.com%2526gehswk0wxtyj%25261%253aeverest13%25261493921799%25261494180999%2526%25261%25262'

  // Grunks Crunky Groove
  formData.X7910 = 'GLYHVKegTW9wCVC317cUbg-63978621038107&63978621038107&&X4700&1626239562&3&1&pXscMY1NegsjVHRJ&grunk&FF8C00&&United States&everestdouglas13@gmail.com&gehswk0wxtyj&1:everest13&1493921799&1494180999&&1&2'

  // Grunks Crunk Zone
  // formData.X7910 = 'vcYJwCI2JjrKnFWsDerTZQ-26256256659165%2626256256659165%26%26X3972%261626241131%261%263%26NrGFFeC6tC8Pno61%26grunk%26FF8C00%26password123%26United+States%26everestdouglas13%40gmail.com%26gehswk0wxtyj%261%3aeverest13%261493921799%261494180999%26%261%262'

  const body = jsonToEFD(formData)

  const response = await axios.post(url, body, { headers: headers })
  console.log(response.data)
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

  await joinRoom(grunksCrunkyGroove, userConfig)
  // await getRoomContents()
})()
