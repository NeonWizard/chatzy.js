const axios = require('axios')
const htmlParser = require('node-html-parser')
const EventEmitter = require('events')

const { jsonToEFD } = require('./util')
const Room = require('./Room.js')

require('dotenv').config()


class Client extends EventEmitter {
  constructor(options) {
    super()

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
    this.emit('debug', `Provided email: ${email}`)

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

    this.emit('debug', 'Posting authentication data...')
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
      throw new Error('Failure logging in.')
    }

    const cookies = response.headers['set-cookie']
    this._cookie = cookies.find(x => x.includes(process.env.EMAIL))

    this.emit('debug', 'Retrieving web page and injected authentication token...')
    response = await axios.get("http://www.chatzy.com", { headers: {
      Cookie: this._cookie
    }})

    const script = htmlParser.parse(response.data).querySelectorAll("script").slice(-1)[0]
    const scriptContent = script.text
    const X3813 = scriptContent.split("X3813=")[1].split(";", 1)[0].slice(1, -1)
    this._token = X3813

    this.emit('ready')
  }

  async fetchRooms() {}
}

module.exports = { Client }
