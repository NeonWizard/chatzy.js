---
slug: reverse-engineering-chatzy
title: Reverse Engineering Chatzy
authors: NeonWizard
tags: []
---

## Login

Logging in is simple - just a few constants, alongside the username and password for the user.
The response body is just some code which I'm assuming just redirects the page to the homepage.
The only interesting part of the response is the `set-cookie` header, particularly the ChatzyUser cookie.
This ChatzyUser cookie is the user's email address appended with an ampersand and then some random characters.
Interestingly - this cookie can be omitted from the call to join a room.
Somehow it's used to fetch the API token, which is currently X3813 sent via an injected script tag.

## Join Room

Logging in is also fairly straightforward. A few constants, some user configuration (nickname, color), and room information.
Interesting to note, as mentioned in the 'Login' section, the ChatzyUser cookie can be omitted without affecting the call.
This is because authentication is done by (currently) X3813 in the post body, which is retrieved from an injected script tag.

## X3813

This is retrieved from an injected script tag. It's unknown why this is the behavior, but seems to be generated into the webpage
whenever the ChatzyUser cookie is sent in a GET request for page HTML. Assumed to be used for all authenticated POST requests.

## ChatzyUser

This is retrieved from a cookie set when logging in. This is assumed to be used for all authenticated webpage GET requests.

## Websocket

There is a websocket which is literally only there for receiving data in realtime.
Messages and data are still sent with POST requests.

## Flow

Login

- <- username, password
- -> ChatzyUser cookie

Homepage Fetch

- <- ChatzyUser cookie
- -> X3813 variable in injected script tag

Join Room

- <- X3813 script variable
- -> X7910 room access token

Send Message

- <- X7910 room access token
