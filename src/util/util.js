const htmlParser = require('node-html-parser')

function jsonToEFD(json) {
  return Object.keys(json).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(json[key])).join('&');
}

function parseMessage(raw) {
  const html = htmlParser.parse(raw).childNodes[0]

  let obj = {
    type: html.classList.contains('a') ? 'user' : 'system',
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
  } else {
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
  }

  return obj
}

module.exports = { jsonToEFD, parseMessage }
