const axios = require('axios')
const htmlParser = require('node-html-parser')
const WebSocket = require('ws')

const { jsonToEFD, parseMessage } = require('./util/util.js')
const constants = require('./util/constants.js')

class Room {
  constructor(client, data) {
    this.client = client
0
    this.roomID = data.roomID // X4016
    this.name = data.name // TODO: if null fetch when joining

    this._token = '' // X7910
    this.geozone = 'us' // apparently always us
    this.geozoneNum = null // X9797
    this.sockInfo = []
    this.nickname = null
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
    if (!this.name) {
      this.name = html.querySelector('#X9303 > div > h1').text
    }

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

  async _buildSocket() {
    this.client.emit('debug', 'Building websocket...')
    await this._getSockInfo()
    const sockNum = this.sockInfo[0] + (this.roomID % this.sockInfo[1]) // magic
    const sockUrl = `ws://${this.geozonePrefix}.chatzy.com/wss/${sockNum}?${this._token}`
    this._socket = new WebSocket(sockUrl)
    this._setupSockHandlers()
  }

  _setupSockHandlers() {
    this._socket.on('open', () => this.client.emit('debug', 'Socket is open!'))

    this._socket.on('ping', () => {
      this.client.emit('debug', 'Socket ping event.')
    })

    this._socket.on('message', raw => {
      this.client.emit('debug', raw, true)
      if (raw.includes('style=')) {
        const message = parseMessage(raw.split('<>')[3])
        message.room = this

        this.client.emit('debug', message, true)
        if (message.username === this.nickname) return

        if (message.type == 'system') {
          if (message.event == 'join') {
            this.client.emit('userJoined', {
              username: message.username,
              room: this
            })
          } else if (message.event == 'leave') {
            this.client.emit('userLeft', {
              username: message.username,
              room: this
            })
          } else {
            this.client.emit('systemMessage', message)
          }
        } else {
          this.client.emit('message', {
            username: message.username,
            content: message.content,
            type: message.event,
            room: this,
          })
        }
      }
    })

    this._socket.on('close', () => {
      this.client.emit('debug', 'Socket was closed.')
      this._buildSocket()
    })
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

    this.client.emit('debug', `Joining room '${this.name}'...`)
    const response = await axios.get(url, { headers: headers })
    if (response.data.includes('error.png')) {
      if (response.data.includes('alias is being used')) {
        throw new Error('This name/alias is being used by another registered Chatzy user in this room.')
      } else {
        throw new Error('Unable to join room.')
      }
    }
    this._token = response.data.split(constants.XRoomToken)[1].slice(9, -18) // X7910

    await this._buildSocket()

    this.nickname = nickname
    this.ready = true
  }

  async fetchContents() {
    this.assertAuthenticated()

    const data = await this._getPostPage()

    const htmlRows = htmlParser.parse(data).querySelectorAll(`#${constants.XChatBox} p`)
    const output = []
    for (const row of htmlRows) {
      const obj = parseMessage(row.outerHTML)

      output.push(obj)
    }

    return output
  }

  async send(message) {
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
