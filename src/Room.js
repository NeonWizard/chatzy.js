const axios = require('axios')
const htmlParser = require('node-html-parser')

const { jsonToEFD } = require('./util')

class Room {
  constructor(client, data) {
    this.client = client
0
    this.roomID = data.roomID // X4016
    this.name = data.name

    this._token = ''
    this.geozone = 'us' // apparently always us
    this.geozoneNum = ''// X9797
    this.ready = false
  }

  get authenticated() { return this._token && this._token !== '' }
  get geozonePrefix() { return `${this.geozone}${this.geozoneNum}` }

  assertJoined() {
    if (!this.authenticated || !this.ready) {
      throw new Error('Room must be joined first to perform this operation.')
    }
  }

  async _getRoomInfo() {
    const headers = {
      Cookie: this.client._cookie
    }

    const response = await axios.get(`http://chatzy.com/${this.roomID}`, { headers: headers })
    const html = htmlParser.parse(response.data)

    const geozoneNum = html.querySelector('input#X9797').getAttribute('value')

    return { geozoneNum }
  }

  async join(nickname, color) {
    this.client.assertAuthenticated()

    const roomInfo = await this._getRoomInfo()
    this.geozoneNum = roomInfo.geozoneNum

    // -- Send join POST
    const urlParams = {
      // -- user config
      X8712: nickname,
      X1711: 'OTC', // specifies using 'other' color
      X6477: color,

      // -- server config
      X9797: this.geozoneNum,
      X4016: this.roomID,

      // -- misc
      X3813: this.client._token,
      X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
      X4812: 1,
      X4778: 'enter',
      X3446: Math.round(Date.now()),
    }
    const queryString = jsonToEFD(urlParams)
    const url = `http://${this.geozonePrefix}.chatzy.com/?jsonp:${queryString}`

    const headers = {
      Referer: "http://www.chatzy.com"
    }

    this.client.emit('debug', 'Joining room...')
    const response = await axios.get(url, { headers: headers })
    if (response.data.includes('error.png')) throw new Error('Unable to join room.')
    this._token = response.data.split('X7910')[1].slice(9, -18) // X7910

    // -- Build websocket

    // this.client.emit('debug', 'Building websocket...')
    // this._socket = new WebSocket(`ws://${this.geozonePrefix}.chatzy.com`)

    this.ready = true
  }

  async fetchContents() {
    this.client.assertAuthenticated()
    this.assertJoined()

    const url = `http://${this.geozonePrefix}.chatzy.com/${this.roomID}`

    const headers = {
      Referer: "http://www.chatzy.com"
    }

    const body = jsonToEFD({
      X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
      X4812: 1, // constant
      X7910: this._token,
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

  async sendMessage(message) {
    this.client.assertAuthenticated()
    this.assertJoined()

    const url = `http://${this.geozonePrefix}.chatzy.com/`

    const headers = {
      Referer: `${url}/${this.roomID}`
    }

    const body = jsonToEFD({
      X2309: 1581170387, // possible epoch time - February 8, 2020. Believed to be time of last update
      X9048: 'X1362', // important
      X7910: this._token,
      X1131: Math.round(Date.now()),
      X9974: message,
    })

    const response = await axios.post(url, body, { headers: headers })
    return response.statusText === 'OK'
  }
}

module.exports = Room
