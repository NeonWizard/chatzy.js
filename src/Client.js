const axios = require('axios')
const htmlParser = require('node-html-parser')
const EventEmitter = require('events')

const { jsonToEFD } = require('./util/util.js')
const constants = require('./util/constants.js')
const Room = require('./Room.js')

require('dotenv').config()

class Client extends EventEmitter {
  constructor(options) {
    super()

    this.user = {
      email: null,
      tag: null
    }

    this._cookie = ''
    this._token = ''
  }

  get loggedIn() {
    return (this._cookie && this._cookie !== '') && (this._token && this._token !== '')
  }

  assertAuthenticated() {
    if (!this.loggedIn) {
      throw new Error('User is not logged in.')
    }
  }

  async login(email, password) {
    this.emit('debug', 'Logging in...')
    this.emit('debug', `Provided email: ${email}`)
    this.user.email = email

    const body = jsonToEFD({
      [constants.XLastUpdate]: constants.lastUpdate,
      X4778: 'sign',
      X3127: email,
      X8485: password,

      // some sort of flag
      X4812: '1',
      X2420: '1',
      X2459: '1'
    })

    this.emit('debug', 'Posting authentication data...')
    let response = await axios.post("https://www.chatzy.com/", body)
    if (!response.data.includes("redirect#ok:entered")) {
      throw new Error('Failure logging in.')
    }

    const cookies = response.headers['set-cookie']
    this._cookie = cookies.find(x => x.includes(process.env.EMAIL))

    this.emit('debug', 'Retrieving web page and injected authentication token...')
    response = await axios.get("http://www.chatzy.com", { headers: {
      Cookie: this._cookie
    }})

    const html = htmlParser.parse(response.data)
    const script = html.querySelectorAll("script").slice(-1)[0]
    const scriptContent = script.text

    this._token = scriptContent
      .split(constants.XClientToken + "=")[1]
      .split(";", 1)[0]
      .slice(1, -1)

    const tag = html.querySelector('#X6595 .X7768').text
    if (tag !== this.email) this.user.tag = tag

    this.emit('ready')
  }

  async fetchRooms() {
    const url = "http://www.chatzy.com/"

    const headers = {
      Cookie: this._cookie
    }

    const response = await axios.get(url, { headers: headers })
    const html = htmlParser.parse(response.data)
    const rows = html.querySelectorAll('table#X3506 tr:not(:first-child) td:first-child a')

    const output = []
    this.emit('debug', 'Rooms:', true)
    for (const row of rows) {
      const data = {
        name: row.innerText,
        roomID: row.outerHTML.split('X4016')[1].split(';')[0].slice(2, -1),
      }
      this.emit('debug', data, true)

      const room = new Room(this, data)
      output.push(room)
    }

    return output
  }

  async joinRoom(id, userInfo) {
    const room = new Room(this, { roomID: id })
    await room.join(
      userInfo?.nickname ?? this.tag,
      userInfo?.color ?? 'FFCC60'
    )
    return room
  }
}

module.exports = Client
