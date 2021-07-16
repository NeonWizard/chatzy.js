const axios = require('axios')
const htmlParser = require('node-html-parser')
const WebSocket = require('ws')

const { jsonToEFD } = require('./util/util.js')
const constants = require('./util/constants.js')

class Room {
  constructor(client, data) {
    this.client = client
0
    this.roomID = data.roomID // X4016
    this.name = data.name

    this._token = '' // X7910
    this.geozone = 'us' // apparently always us
    this.geozoneNum = null // X9797
    this.sockInfo = []
    this.ready = false
  }

  get authenticated() { return this._token && this._token !== '' }
  get geozonePrefix() { return `${this.geozone}${this.geozoneNum}` }

  assertJoined() {
    if (!this.authenticated || !this.ready) {
      throw new Error('Room must be joined first to perform this operation.')
    }
  }

  assertAuthenticated() {
    this.client.assertAuthenticated()
    if (!this.authenticated) {
      throw new Error('Must be authenticated in this room to perform this operation.')
    }
  }

  async _getRoomInfo() {
    const headers = {
      Cookie: this.client._cookie
    }

    const response = await axios.get(`http://chatzy.com/${this.roomID}`, { headers: headers })
    const html = htmlParser.parse(response.data)

    this.geozoneNum = html.querySelector('input#X9797').getAttribute('value')

    return {
      geozoneNum: this.geozoneNum,
    }
  }

  async _getPostPage() {
    this.assertAuthenticated()

    const url = `http://${this.geozonePrefix}.chatzy.com/${this.roomID}`

    const headers = {
      Referer: "http://www.chatzy.com"
    }

    const body = jsonToEFD({
      [constants.XLastUpdate]: constants.lastUpdate,
      X4812: 1, // constant
      [constants.XRoomToken]: this._token,
    })

    const response = await axios.post(url, body, { headers: headers })
    return response.data
  }

  async _getSockInfo() {
    const data = await this._getPostPage()
    const html = htmlParser.parse(data)

    const script = html.querySelectorAll("script").slice(-1)[0]
    const scriptContent = script.text
    this.sockInfo = scriptContent
      .split('7084')[1]
      .split(';')[0]
      .slice(3, -2)
      .split(',')
      .map(x => parseInt(x))

    return this.sockInfo
  }

  async join(nickname, color) {
    this.client.assertAuthenticated()
    await this._getRoomInfo()

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
      [constants.XClientToken]: this.client._token,
      [constants.XLastUpdate]: constants.lastUpdate,
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
    this._token = response.data.split(constants.XRoomToken)[1].slice(9, -18) // X7910

    // -- Build websocket
    this.client.emit('debug', 'Building websocket...')
    await this._getSockInfo()
    const sockNum = this.sockInfo[0] + (this.roomID % this.sockInfo[1]) // magic
    const sockUrl = `ws://${this.geozonePrefix}.chatzy.com/wss/${sockNum}?${this._token}`
    this._socket = new WebSocket(sockUrl)
    this._socket.on('open', () => this.client.emit('debug', 'Socket is open!'))

    this.ready = true
  }

  async fetchContents() {
    this.assertAuthenticated()

    const data = await this._getPostPage()

    const htmlRows = htmlParser.parse(data).querySelectorAll("#X2803 .a, #X2803 .b")
    const output = []
    for (const row of htmlRows) {
      let obj = {}
      obj.type = row.classList.contains('a') ? 'user' : 'system'

      if (row.childNodes.length == 1) {
        obj.message = row.childNodes[0].text
      } else {
        obj.username = row.childNodes[0].text
        obj.message = row.childNodes[1]._rawText.slice(obj.type == 'system' ? 1 : 2)
      }

      output.push(obj)
    }

    return output
  }

  async sendMessage(message) {
    this.assertAuthenticated()

    const url = `http://${this.geozonePrefix}.chatzy.com/`

    const headers = {
      Referer: `${url}/${this.roomID}`
    }

    const body = jsonToEFD({
      [constants.XLastUpdate]: constants.lastUpdate,
      X9048: 'X1362', // important
      X1131: Math.round(Date.now()),
      X9974: message,
      [constants.XRoomToken]: this._token,
    })

    const response = await axios.post(url, body, { headers: headers })
    return response.statusText === 'OK'
  }
}

module.exports = Room
