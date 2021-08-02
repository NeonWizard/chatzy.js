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
    obj.username = html.childNodes[0].text
    obj.content = html
        .childNodes
        .slice(1)
        .reduce((acc, cur) => acc + cur.text, '')
        .slice(2)
  } else if (obj.type == 'system') {
    if (html.childNodes.length == 1) {
      obj.content = html.childNodes[0].text
    } else {
      obj.username = html.childNodes[0].text
      obj.content = html
        .childNodes
        .slice(1)
        .reduce((acc, cur) => acc + cur.text, '')
        .slice(1)
    }
  } else if (obj.type == 'embed') {
    // Embed is made of two parts - p for username and div for contents (with multiple p tags), each with class 'c'
    console.warn('WARNING: Embeds not currently supported.')
  } else {
    console.error(`ERROR: Unknown message type: ${html.classList.values()}`)
  }

  return obj
}

module.exports = { jsonToEFD, parseMessage }
