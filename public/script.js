var width = 320, height = 0, video, canvas, photo, startbutton, okBtn,
  streaming, message, clearImage, dotdotInterval, ctx, handle;

function onload() {
  message = document.getElementById('message');
  video = document.getElementById('video');
  photo = document.getElementById('photo');
  startbutton = document.getElementById('startbutton');
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  navigator.getMedia = ( navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

  navigator.getMedia({
      video: true,
      audio: false
    },
    (stream) => {
      var vendorURL = window.URL || window.webkitURL;
      video.src = vendorURL.createObjectURL(stream);
      videoStart();
    },
    (err) => {
      console.error("An error occured! " + err);
    }
  );

  video.addEventListener('canplay', (ev) => {
    if (!streaming) {
      height = video.videoHeight;
      width = video.videoWidth;
      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  startbutton.addEventListener('click', (ev) => {
    takepicture();
    ev.preventDefault();
  }, false);

  document.body.onkeyup = function(e){
    //Take Picture on Spacebar
    if(e.keyCode == 32){ takepicture();}
  }

}

function takepicture() {
  var data = canvas.toDataURL('image/png');
  photo.setAttribute('src', data);
  photo.style.height = video.offsetHeight;

  videoPause();

  showMessage('Detecting stuff. We can tell by the pixels o.0', true);

  var form = new FormData()
  form.append('pic', data);

  fetch("/sendpic", {
    method: "POST",
    body: form
  }).then((response) => {
    return response.json();
  }).then((features) => {
    console.log(features);
    var found = false;

    // show labels and text
    displayList(features.labelAnnotations, document.getElementById("labels"));
    displayList(features.textAnnotations, document.getElementById("text"));
    message.style.display = 'none';

    clearImage = true;

    ctx.beginPath();
    ctx.strokeStyle = "#80ff80";
    ctx.fillStyle = "#80ff80";
    for (var face of features.faceAnnotations) {
      var startPoint = face.boundingPoly.vertices[face.boundingPoly.vertices.length-1];
      console.log(startPoint);
      ctx.moveTo(startPoint.x, startPoint.y);
      for (var point of face.boundingPoly.vertices) {
        ctx.fillRect(point.x-3, point.y-3, 7, 7);
        ctx.lineTo(point.x, point.y);
      };
      ctx.stroke();
    }
    ctx.closePath();

    setTimeout(() => {
      videoStart();
    },8134)

  }).catch((err) => {
    console.error('There was a problem :(');
    console.error(err);
    showMessage("Great, you broke it.");
    clearImage = true;
  });
}

function showMessage(text, dotdot) {
  var messageText = document.getElementById('message-text');
  messageText.innerText = text;
  message.style.display = 'inline-block';
  if (dotdotInterval) {
    clearInterval(dotdotInterval);
  }
  if (dotdot) {
    dotdotInterval = setInterval(() => {
      messageText.innerText = messageText.innerText + ".";
    }, 500);
  }
}

function displayList(array, element) {
  element.innerHTML = '';
  for (var i = 0; i < array.length; i++){
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(array[i].description));
    element.appendChild(li);
  }
}

function videoStart() {
  video.play();
  handle = setInterval(() => {
    ctx.drawImage(video, 0, 0, width, height);
  }, 20);
}

function videoPause() {
  if (handle) {
    clearInterval(handle);
  }
  video.pause();
}
