const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

const words = ["apple", "orange", "banana", 'bear']

function randomFrom(arr, exclude) {
  let el = arr[Math.floor(Math.random() * arr.length)]

  return el
}

function sortObjectByKeys(o) {
  return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}
async function getCurrentUsers() {
  const currentUsers = await io.allSockets();
  // console.log(currentUsers)
  return(currentUsers)
}

let leaders = {}
let currentWord = randomFrom(words)
let currentDrawer = randomFrom(getCurrentUsers())

function onConnection(socket) {

    function newGame() {
        // start new game
        currentWord = randomFrom(words, currentWord)
        io.emit('new word', currentWord)
    }
  
    socket.emit('set current info', {
      currentWord: currentWord,
      currentDrawer: currentDrawer,
      leaders: leaders
    })

    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
    socket.on('new message', function (username, message) {
      // console.log(message, currentWord)
      io.emit('new message', username, message)
        if (message == currentWord) {
            if (username in leaders) {
                leaders[username] ++
            } else {
                leaders[username] = 1
            }
            leaders = sortObjectByKeys(leaders)
            console.log(leaders)
            io.emit('update leaders', leaders)
            newGame()
        } else {
        }
    })
}

io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));

