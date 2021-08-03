const htmlParser = require('node-html-parser')

function jsonToEFD(json) {
  return Object.keys(json).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(json[key])).join('&');
}

function parseMessage(raw) {
  const types = {
    'a': 'user',
    'b': 'system',
    'c': 'embed'
  }

  const html = htmlParser.parse(raw).childNodes[0]

  let obj = {
    type: types[Object.keys(types).find(x => html.classList.contains(x))],
    username: null,
    content: ''
  }

  if (obj.type == 'user') {
    // -- Basic user message --
    obj.username = html.childNodes[0].text
    obj.content = html
        .childNodes
        .slice(1)
        .reduce((acc, cur) => acc + cur.text, '')
        .slice(2)

  } else if (obj.type == 'system') {
    // -- System message --
    let elem, content
    if (span = html.querySelector('span.h')) {
      content = span.getAttribute('title')
      elem = span
    } else {
      content = html.text
      elem = html
    }

    if (elem.childNodes.length == 1) {
      // non-user
      obj.content = elem.childNodes[0].text
    } else {
      // user
      obj.username = elem.childNodes[0].text
      obj.content = elem
        .childNodes
        .slice(1)
        .reduce((acc, cur) => acc + cur.text, '')
        .slice(1)

      if (content.includes('joined the chat')) {
        obj.event = 'join'
      } else if (content.includes('left the chat')) {
        obj.event = 'leave'
      }
    }

  } else if (obj.type == 'embed') {
    // -- Embed --

    // Embed is made of two parts - p for username and div for contents (with multiple p tags), each with class 'c'
    console.warn('WARNING: Embeds not currently supported.')

  } else {
    console.error(`ERROR: Unknown message type: ${html.classList.values()}`)
  }

  return obj
}

module.exports = { jsonToEFD, parseMessage }
