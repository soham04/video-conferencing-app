var localUuid;
var localDisplayName;
var localStream;
var socket;
let roomID;
var peerConnections = {};
let messageContainer;
let participantContainer;
let messageForm;
let messageInput;
let messageButton;
let toggleVideoStream;
let toggleMicStream;
let streams = [];
let recordButton;
var recorder;
var stopRecordButton;
let recordingStream;
let screenShareButton;
let videoChanger;
let tmpNewStream;



// Configuration variables ===========================================

// ! PEER Object

var peerConnectionConfig = {
  iceServers: [
    // { 'urls': 'stun:stun.stunprotocol.org:3478' },
    // { 'urls': 'stun:stun.l.google.com:19302' },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
    {
      urls: "stun:stun2.l.google.com:19302",
    },
    {
      urls: "stun:stun3.l.google.com:19302",
    },
    {
      urls: "stun:stun4.l.google.com:19302",
    },
  ],
};

// ! Record RTC

var recordRTCOptions = {
  mimeType: "video/webm",
};

// ! START and Settup

function start() {
  messageContainer = document.querySelector(".conference__chat--items");
  participantContainer = document.querySelector(
    ".conference__participants--items"
  );
  messageForm = document.getElementById("send-container");
  messageInput = document.getElementById("message-input");
  messageButton = document.getElementById("send-button");
  toggleVideoStream = document.getElementById("toggle-video-stream");
  toggleMicStream = document.getElementById("toggle-mic-stream");
  startStream = document.getElementById("start-stream");
  recordButton = document.getElementById("record-button");
  stopRecordButton = document.getElementById("stop-record-button");
  recordingStream = document.getElementById("recording");
  screenShareButton = document.querySelector('#screen-share-button');
  localUuid = createUUID();

  // check if "&displayName=xxx" is appended to URL, otherwise alert user to populate
  // var urlParams = new URLSearchParams(window.location.search);
  // localDisplayName = prompt('Enter your name', '');
  // roomID = prompt('Room ID', '');
  document
    .getElementById("localVideoContainer")
    .appendChild(makeLabel(localDisplayName));
  document
    .getElementById("localVideoContainer")
    .insertAdjacentHTML("beforeend", makePinBtn());
  // specify  audio for user media
  var constraints = {
    video: {
      width: {
        max: 320,
      },
      height: {
        max: 240,
      },
      frameRate: {
        max: 30,
      },
    },
    audio: true,
  };

  // set up local video stream
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        console.log("Local Stream  = " + stream);
        localStream = stream;
        console.log("Stream objet = " + stream);

        // adding the local stream to the streams array
        streams.push(stream);

        toggleVideoStream.addEventListener("click", (e) => { // enable and disable camera 
          e.preventDefault();
          console.log(stream.getVideoTracks());
          stream.getVideoTracks()[0].enabled =
            !stream.getVideoTracks()[0].enabled;
        });

        toggleMicStream.addEventListener("click", (e) => { // enable and disable mic 
          e.preventDefault();
          console.log(stream.getAudioTracks());
          stream.getAudioTracks()[0].enabled =
            !stream.getAudioTracks()[0].enabled;
        });

        document.getElementById("localVideo").srcObject = stream;
      })
      .catch(errorHandler)

      // set up websocket and message all existing clients
      .then(() => {

        console.log("hi");

        socket = io();
        socket.on("message_from_server", (message) => {
          console.log("hi");
          gotMessageFromServer(message);
        });

        socket.emit(
          "join",
          JSON.stringify({
            displayName: localDisplayName,
            uuid: localUuid,               // make this username draw from DB
            dest: "all",
            room: roomID,
          })
        );

        socket.on("chat-message", (data) => {
          // let tmp = JSON.parse(data)

          /**
           * JSON structure
           * message: message,
           * room: roomID,
           * uuid: localUuid,
           * displayname: localDisplayName,
           * proPic: proPic,
           * use '.' to access these
           * eg. data.proPic
           */

          if (data.uuid == localUuid) {
            appendMessage(true, data);
          } else {
            appendMessage(false, data);
          }
          // appendMessage(`${data.displayname}: ${data.message}`);
        });

        messageButton.addEventListener("click", (e) => {
          e.preventDefault();
          console.log("clicked send message button");
          const message = messageInput.value;
          // appendMessage(`You: ${message}`);
          appendMessage(true, {
            message: message,
            room: roomID,
            uuid: localUuid,
            displayname: localDisplayName,
            proPic: proPic,
          });
          socket.emit("send-chat-message", {
            message: message,
            room: roomID,
            uuid: localUuid,
            displayname: localDisplayName,
            proPic: proPic,
          });
          messageInput.value = "";
        });

        recordButton.addEventListener("click", (e) => {
          e.preventDefault();
          console.log("strting recodring");
          recorder = new MultiStreamRecorder(streams, recordRTCOptions);
          recorder.record();
        });


        screenShareButton.addEventListener("click", (e) => {
          console.log('screen share')

          if (screenShareButton.getAttribute("data-toggle") == "on") {

            // Toggle camera

            console.log("off screen share");
            if (navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices
                .getUserMedia(constraints)
                .then((stream) => {
                  videoChanger.replaceTrack(stream.getVideoTracks()[0]);
                  tmpNewStream = new MediaStream()
                  tmpNewStream.addTrack(stream.getVideoTracks()[0])
                  document.getElementById("localVideo").srcObject = tmpNewStream
                });
            }

            screenShareButton.setAttribute("data-toggle", "off");
            // screenShareButton.getAttribute("data-toggle") = "off"
          } else {

            // Toggle screenshare

            console.log("adding screen stream");
            e.preventDefault();
            if (navigator.mediaDevices.getDisplayMedia) {
              navigator.mediaDevices.getDisplayMedia().then((stream) => {
                // videoChanger.replaceTrack(stream.getVideoTracks()[0]);
                // tmpNewStream = new MediaStream()
                // tmpNewStream.addTrack(stream.getVideoTracks()[0])


                videoChanger = peerConnections[peerUuid].pc.addTrack(track, localStream);

                document.getElementById("localVideo").srcObject = tmpNewStream
              });
            }
            screenShareButton.setAttribute("data-toggle", "on");
          }

          // Code to again adding the local stream

          // if (navigator.mediaDevices.getUserMedia) {
          //   navigator.mediaDevices
          //     .getUserMedia()
          //     .then((stream) => {

          //       videoChanger.replaceTrack(stream.getVideoTracks())
          //     })
          // }
        });

        stopRecordButton.addEventListener("click", (e) => {
          e.preventDefault();
          console.log("REcording to be stoped");

          recorder.stop(function (blob) {

            // recordingStream.src = URL.createObjectURL(blob);
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = "recording.webm";
            a.click();
            window.URL.revokeObjectURL(url);
          });
        });

        socket.on("drawing", onDrawingEvent);


        streams.push(canvas.captureStream());
        // recordingStream.srcObject = canvas.captureStream()

        // recordingStream.srcObject =

        // ! CHAT MESSAGE OF JOINING
        appendMessage(true, {
          message: "Joined",
          room: roomID,
          uuid: localUuid,
          displayname: localDisplayName,
          proPic: proPic,
        });
      })
      .catch(errorHandler);
  } else {
    alert("Your browser does not support getUserMedia API");
  }
}

// ! Messenger -------------------------------------------------------

function appendMessage(owner, data) {
  console.log(data);
  const msgElm = `<div class='conference__chat--item ${owner ? "conference__chat--item-user" : ""
    }'>
                <div class="conference__chat--item-icon">
                  <img src="${data.proPic}" alt="" />
                </div>
                <div class="conference__chat--item-message">
                  ${data.message}
                </div>
                <div class="conference__chat--item-detail">10:00 am, ${data.displayname
    }</div>
              </div>`;
  const participantElem = ` <div class="conference__participants--item">
                <div class="conference__participants--item-img">
                  <img src="${data.proPic}" alt="" />
                </div>
                <div class="conference__participants--item-desc">
                  <div class="conference__participants--item-name">
                    ${data.displayname}
                  </div>
                  <div class="conference__participants--item-subname">
                    User
                  </div>
                </div>
                <div class="conference__participants--item-controls">
                  <div class="conference__participants--item-mute">
                    <i class="lni lni-mic"></i>
                  </div>
                  <div class="conference__participants--item-pin">
                    <i class="lni lni-pin"></i>
                  </div>
                </div>
              </div>`;

  if (data.message.includes("Joined") || data.message.includes("Connected")) {
    const notifElm = `<div class="conference__chat--notification">
                <p>${data.displayname} ${data.message}</p>
              </div>`;
    messageContainer.insertAdjacentHTML("beforeend", notifElm);
    participantContainer.insertAdjacentHTML("beforeend", participantElem);

    peerDisconnectToast(`${data.displayname} ${data.message}`, "");
    return 1;
  }
  messageContainer.insertAdjacentHTML("beforeend", msgElm);
}

// ! END Messenger -------------------------------------------------------

// ! START WEBRTC Signalling ---------------------------------------------------------------

function gotMessageFromServer(message) {
  console.log("-> Got message from server = \n" + message);
  var signal = JSON.parse(message);
  // var signal = message
  console.log("-> Got message : \n" + signal);
  var peerUuid = signal.uuid;
  console.log(peerUuid);

  // Ignore messages that are not for us or from ourselves
  if (
    peerUuid == localUuid ||
    (signal.dest != localUuid && signal.dest != "all")
  )
    return;

  if (signal.displayName && signal.dest == "all") {
    // set up peer connection object for a newcomer peer
    setUpPeer(peerUuid, signal.displayName);
    socket.emit(
      "message_from_client",
      JSON.stringify({
        displayName: localDisplayName,
        uuid: localUuid,
        dest: peerUuid,
        room: roomID,
      })
    );
  } else if (signal.displayName && signal.dest == localUuid) {
    // initiate call if we are the newcomer peer
    setUpPeer(peerUuid, signal.displayName, true);
  } else if (signal.sdp) {
    peerConnections[peerUuid].pc
      .setRemoteDescription(new RTCSessionDescription(signal.sdp))
      .then(function () {
        // Only create answers in response to offers
        if (signal.sdp.type == "offer") {
          peerConnections[peerUuid].pc
            .createAnswer()
            .then((description) => createdDescription(description, peerUuid))
            .catch(errorHandler);
        }
      })
      .catch(errorHandler);
  } else if (signal.ice) {
    peerConnections[peerUuid].pc
      .addIceCandidate(new RTCIceCandidate(signal.ice))
      .catch(errorHandler);
  }
}

function setUpPeer(peerUuid, displayName, initCall = false) {
  peerConnections[peerUuid] = {
    displayName: displayName,
    pc: new RTCPeerConnection(peerConnectionConfig),
  };
  peerConnections[peerUuid].pc.onicecandidate = (event) =>
    gotIceCandidate(event, peerUuid);
  peerConnections[peerUuid].pc.ontrack = (event) =>
    gotRemoteStream(event, peerUuid);
  peerConnections[peerUuid].pc.oniceconnectionstatechange = (event) =>
    checkPeerDisconnect(event, peerUuid);
  // peerConnections[peerUuid].pc.addStream(localStream);

  localStream.getTracks().forEach((track) => {
    videoChanger = peerConnections[peerUuid].pc.addTrack(track, localStream);
  });

  if (initCall) {
    peerConnections[peerUuid].pc
      .createOffer()
      .then((description) => createdDescription(description, peerUuid))
      .catch(errorHandler);
  }
}

function gotIceCandidate(event, peerUuid) {
  if (event.candidate != null) {
    socket.emit(
      "message_from_client",
      JSON.stringify({
        ice: event.candidate,
        uuid: localUuid,
        dest: peerUuid,
        room: roomID,
      })
    );
  }
}

function createdDescription(description, peerUuid) {
  console.log(`got description, peer ${peerUuid}`);
  peerConnections[peerUuid].pc
    .setLocalDescription(description)
    .then(function () {
      socket.emit(
        "message_from_client",
        JSON.stringify({
          sdp: peerConnections[peerUuid].pc.localDescription,
          uuid: localUuid,
          dest: peerUuid,
          room: roomID,
        })
      );
    })
    .catch(errorHandler);
}
let gEvent = [];

function gotRemoteStream(event, peerUuid) {
  console.log("EVENT = " + event);
  gEvent.push(event);

  if (event.track.kind == "audio") {
    /* id = "remoteVideo_" + peerUuid;
     console.log("hi:", id);
     let vidContainer = `<div class="custom-col">
                  <audio autoplay src="${event.streams[0]}"></audio>
                  <video autoplay muted loop id="localVideo ${id}">
                    <source src="/video/Skyscrapers - 80724.mp4" type="" />
                  </video>
                  <div class="conferenceVideoLabel">${peerConnections[peerUuid].displayName}</div>
                  <button class="btn videoPinBtn">
                    <i class="fas fa-thumbtack"></i>
                  </button>
                  </div>`; */
    var sound = document.createElement("audio");

    sound.setAttribute("autoplay", "");
    sound.srcObject = event.streams[0];

    var vidContainer = document.createElement("div");
    vidContainer.setAttribute("id", "remoteVideo_" + peerUuid);
    vidContainer.classList.add("custom-col");
    vidContainer.appendChild(sound);
    vidContainer.insertAdjacentHTML("beforeend", makePinBtn());
    // let el = 0;
    // el = document
    //   .querySelectorAll(".custom-col")
    //   .filter((col) => col.classList.contains("pinned"));
    // if (el != 0) {
    //   console.log(el);
    //   // vidContainer.classList.add("unpinned");
    // }

    document.getElementById("videos").appendChild(vidContainer);

    updateLayout();
    pinVideo();

    return;
  }

  console.log("hey there");

  streams.push(event.streams[0]);

  console.log("STREAM TYPE = " + event.track.kind);

  if (recorder != null) {
    recorder.addStreams(event.streams[0]);
  }

  appendMessage(false, {
    message: "Joined",
    room: roomID,
    uuid: peerUuid,
    displayname: peerConnections[peerUuid].displayName,
    proPic: proPic,
  });
  // appendMessage("+ " + peerConnections[peerUuid].displayName + " Connected");
  let tmp = document.getElementById("remoteVideo_" + peerUuid);

  // console.log(`got remote stream, peer ${peerUuid}`);
  // console.log("soham : " + event.streams[0]);

  var vidElement = document.createElement("video");
  vidElement.setAttribute("autoplay", "");
  vidElement.srcObject = event.streams[0];

  // var vidContainer = document.createElement('div');
  // vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
  // vidContainer.setAttribute('class', 'videoContainer');
  let vidContainerold = document.getElementById("remoteVideo_" + peerUuid);
  vidContainerold.appendChild(vidElement);
  vidContainerold.appendChild(makeLabel(peerConnections[peerUuid].displayName));

  // document.getElementById('videos').appendChild(vidContainerold);

  updateLayout();
}

function peerDisconnectToast(name, status) {
  toast = `<div
          class="toast align-items-center"
          data-bs-delay="2000"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div class="d-flex bg-dark text-white">
            <div class="toast-body">${name} ${status}</div>
            <button
              type="button"
              class="btn-close me-2 m-auto text-white"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
        </div>`;

  const toastContainer = document.querySelector(".toast-container");
  toastContainer.insertAdjacentHTML("beforeend", toast);

  var toastElList = [].slice.call(document.querySelectorAll(".toast"));
  var toastList = toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl);
  });
  toastList[toastList.length - 1].show();
}

function checkPeerDisconnect(event, peerUuid) {
  var state = peerConnections[peerUuid].pc.iceConnectionState;
  console.log(`connection with peer ${peerUuid} ${state}`);
  const name = peerConnections[peerUuid].displayName;
  if (state === "failed" || state === "closed" || state === "disconnected") {
    delete peerConnections[peerUuid];
    document
      .getElementById("videos")
      .removeChild(document.getElementById("remoteVideo_" + peerUuid));
    updateLayout();
    peerDisconnectToast(name, "disconnected");

    const notifElm = `<div class="conference__chat--notification">
                <p>${name} disconnected</p>
              </div>`;
    messageContainer.insertAdjacentHTML("beforeend", notifElm);
  }
}

function updateLayout() {
  // update CSS grid based on number of diplayed videos
  const layout = document.querySelector("#videos");
  const videoCount = layout.childElementCount;
  if (videoCount >= 0 && videoCount <= 4) {
    layout.classList.add("layout-4");
    layout.classList.remove("layout-6");
  } else {
    layout.classList.remove("layout-4");
    layout.classList.add("layout-6");
  }
}

function makeLabel(label) {
  var vidLabel = document.createElement("div");
  vidLabel.appendChild(document.createTextNode(label));
  vidLabel.setAttribute("class", "conferenceVideoLabel");
  return vidLabel;
}

function makePinBtn() {
  var btn = `<button class="btn videoPinBtn"><i class="fas fa-thumbtack"></i></button>`;
  return btn;
}

function errorHandler(error) {
  console.log("Error ------------------------------------------\n" + error);
}

function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

// ! END WEBRTC Signalling ---------------------------------------------------------------


document.getElementById("codeMeetJoin").innerHTML = document.URL