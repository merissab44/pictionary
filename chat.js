module.exports = (io, socket) => {

    socket.on('new guess', (data) => {
        socket.emit('new guess', data)
    })



}