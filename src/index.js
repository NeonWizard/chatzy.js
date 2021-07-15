const axios = require('axios')
const htmlParser = require('node-html-parser')

const { jsonToEFD } = require('./util/index.js')

require('dotenv').config()


class Client {
  constructor(options) {
    this._cookie = ''
    this._token = ''
  }

  get loggedIn() {
    return (this._cookie && this._cookie !== '') && (this._token && this._token !== '')
  }

  _assertAuthenticated() {
    if (!this.loggedIn) {
      throw new Error('User is not logged in.')
    }
  }

  async login(email, password) {
    const body = jsonToEFD({
      X2309: '1581170387', // possible epoch time - February 8, 2020. Believed to be time of last update
      X4778: 'sign',
      X3127: email,
      X8485: password,

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
    this._cookie = cookies.find(x => x.includes(process.env.EMAIL))

    response = await axios.get("http://www.chatzy.com", { headers: {
      Cookie: this._cookie
    }})

    const script = htmlParser.parse(response.data).querySelectorAll("script").slice(-1)[0]
    const scriptContent = script.text
    const X3813 = scriptContent.split("X3813=")[1].split(";", 1)[0].slice(1, -1)
    this._token = X3813
  }

  async fetchRooms() {}

  async joinRoom(roomData, userConfig) {
    this._assertAuthenticated()

    const urlParams = {
      ...roomData,
      ...userConfig,
      X3813: this._token,
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

  async fetchRoomContents(token, roomData) {
    this._assertAuthenticated()

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

  async sendMessage(token, roomData, message) {
    this._assertAuthenticated()

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
    return response.statusText === 'OK'
  }
}

module.exports = { Client }
