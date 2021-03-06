'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  console.log(canvas.height)
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var context = canvas.getContext('2d');

  // store name
  let name
  var current = {
    color: 'black'
  };
  var drawing = false;

  
  function addDrawingListeners() {
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
    
  
    canvas.addEventListener('touchstart', onMouseDown, false);
    canvas.addEventListener('touchend', onMouseUp, false);
    canvas.addEventListener('touchcancel', onMouseUp, false);
    canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);
  }

  function removeDrawingListeners() {
    canvas.removeEventListener('mousedown', onMouseDown, false);
    canvas.removeEventListener('mouseup', onMouseUp, false);
    canvas.removeEventListener('mouseout', onMouseUp, false);
    canvas.removeEventListener('mousemove', throttle(onMouseMove, 10), false);
    
  
    canvas.removeEventListener('touchstart', onMouseDown, false);
    canvas.removeEventListener('touchend', onMouseUp, false);
    canvas.removeEventListener('touchcancel', onMouseUp, false);
    canvas.removeEventListener('touchmove', throttle(onMouseMove, 10), false);
  }

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  //Takes the color and follows the path of your drawing
  function drawLine(x0, y0, x1, y1, color, emit){
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX||e.touches[0].clientX;
    current.y = e.clientY||e.touches[0].clientY;
  }

  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, current.color, true);
  }

  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX||e.touches[0].clientX, e.clientY||e.touches[0].clientY, current.color, true);
    current.x = e.clientX||e.touches[0].clientX;
    current.y = e.clientY||e.touches[0].clientY;
  }

  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function updateElements(data) {
    console.log(data)
    let drawer = data.currentDrawer
    //if i am drawer
    if (drawer == socket.id) {
      drawer = 'You';
      $('#chat-container').hide()
      addDrawingListeners()
      $("#current-word").text(data.currentWord)
    } else {
      $('#chat-container').show()
      $("#current-word").text('')
      removeDrawingListeners()
    }
    $("#current-drawer").text('Current Drawer: ' + drawer)
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

    // add message sender listener
    $('#message-send-btn').on("click", function (e) {
        socket.emit("new message", name, $("#chat-input").val())
        $("#chat-input").val("")
    })

    // socket stuff
    socket.on('drawing', function onDrawingEvent(data){
        var w = canvas.width;
        var h = canvas.height;
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    });

    socket.on('connect', function (){
        name = socket.id
    });

    socket.on('set current info', updateElements)

    socket.on('new message', (username, message) => {
        $('#message-container').append(`
            <div class="message">
                <span class="message-user">${username}: </span>
                <span class="message-text">${message}</span>
            </div>
        `);
    })

    socket.on('new word', updateElements)

    socket.on('update leaders', (leaders) => {
      $('#leaderlist').empty()
      for (const [name, score] of Object.entries(leaders)) {
        $('#leaderlist').append(`
            <div class="leader">
                <span class="message-user">${name}: </span>
                <span class="message-text">${score}</span>
            </div>
        `)
      }
    })

})();