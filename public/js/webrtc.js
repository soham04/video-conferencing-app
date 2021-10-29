var localUuid;
var localDisplayName;
var localStream;
var socket;
let roomID;
var peerConnections = {};
let messageContainer
let messageForm
let messageInput
let messageButton
let stopStream
let startStream
let streams = []
let recordButton
var recorder
var stopRecordButton
let recordingStream
let screenShareButton

// White Board vairable ----------------------------------

var canvas = document.getElementsByClassName('whiteboard')[0];
var colors = document.getElementsByClassName('color');
var context = canvas.getContext('2d');

// Configuration variables ===========================================

// ! PEER Object 

var peerConnectionConfig = {
    'iceServers': [
        // { 'urls': 'stun:stun.stunprotocol.org:3478' },
        // { 'urls': 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ]
};

// ! Record RTC

var recordRTCOptions = {
    mimeType: 'video/webm'
}

// ! WHITEBOARD

var current = {
    color: 'black'
};
var drawing = false;

// ! START and Settup 

function start() {
    messageContainer = document.getElementById('message-container')
    messageForm = document.getElementById('send-container')
    messageInput = document.getElementById('message-input')
    messageButton = document.getElementById("send-button")
    stopStream = document.getElementById("stop-stream")
    startStream = document.getElementById("start-stream")
    recordButton = document.getElementById("record-button")
    stopRecordButton = document.getElementById("stop-record-button")
    recordingStream = document.getElementById("recording")
    screenShareButton = document.getElementById("screen-share-button")

    localUuid = createUUID();

    // check if "&displayName=xxx" is appended to URL, otherwise alert user to populate
    // var urlParams = new URLSearchParams(window.location.search);
    // localDisplayName = prompt('Enter your name', '');
    roomID = prompt('Room ID', '');
    document.getElementById('localVideoContainer').appendChild(makeLabel(localDisplayName));

    // specify  audio for user media
    var constraints = {
        video: {
            width: { max: 320 },
            height: { max: 240 },
            frameRate: { max: 30 },
        },
        audio: true,
    };

    // set up local video stream
    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                console.log("Local Stream  = " + stream);
                localStream = stream;
                console.log("Stream objet = " + stream);

                // adding the local stream to the streams array 
                streams.push(stream)

                stopStream.addEventListener('click', e => {
                    e.preventDefault()
                    // alert("clicked")
                    console.log("stop stream");
                    // stream.getVideoTracks()[0].stop()
                    stream.getVideoTracks()[0].enabled = false
                })

                startStream.addEventListener('click', e => {
                    e.preventDefault()
                    // alert("clicked")
                    console.log("resume stream");
                    // stream.getVideoTracks()[0].stop()
                    stream.getVideoTracks()[0].enabled = true
                })

                document.getElementById('localVideo').srcObject = stream;
            }).catch(errorHandler)

            // set up websocket and message all existing clients
            .then(() => {

                socket = io()
                socket.on("message_from_server", (message) => {
                    gotMessageFromServer(message)
                })

                socket.emit("join", JSON.stringify({ 'displayName': localDisplayName, 'uuid': localUuid, 'dest': 'all', 'room': roomID }))

                socket.on('chat-message', data => {
                    // let tmp = JSON.parse(data)

                    appendMessage(`${data.displayname}: ${data.message}`)
                })

                messageButton.addEventListener('click', e => {
                    e.preventDefault()
                    console.log("clciked send meesage button");
                    const message = messageInput.value
                    appendMessage(`You: ${message}`)
                    socket.emit('send-chat-message', { 'message': message, 'room': roomID, 'uuid': localUuid, 'displayname': localDisplayName })
                    messageInput.value = ''
                })

                recordButton.addEventListener('click', e => {
                    e.preventDefault()
                    console.log("strting recodring");
                    recorder = new MultiStreamRecorder(streams, recordRTCOptions);
                    recorder.record()
                })

                screenShareButton.addEventListener('click', e => {
                    console.log("adding screen stream");
                    e.preventDefault()
                    startScreenShare()
                    // const screenStream = await navigator.mediaDevices.getDisplayMedia();

                    // navigator.mediaDevices.getDisplayMedia().then(screenStream => {
                    //     var peerC;
                    //     for (var key in peerConnections) {
                    //         peerC = peerConnections[key];
                    //         // your code here...
                    //         peerC.pc.addStream(screenStream)
                    //     }
                    //     start()
                    // }).catch(errorHandler)


                })

                stopRecordButton.addEventListener('click', e => {
                    e.preventDefault()
                    console.log("REcording to be stoped");

                    recorder.stop(function (blob) {
                        recordingStream.src = URL.createObjectURL(blob);
                    });
                })

                // ! WHITE BORAD START

                for (var i = 0; i < colors.length; i++) {
                    colors[i].addEventListener('click', onColorUpdate, false);
                }

                socket.on('drawing', onDrawingEvent);

                window.addEventListener('resize', onResize, false);
                onResize();

                canvas.addEventListener('mousedown', onMouseDown, false);
                canvas.addEventListener('mouseup', onMouseUp, false);
                canvas.addEventListener('mouseout', onMouseUp, false);
                canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

                //Touch support for mobile devices
                canvas.addEventListener('touchstart', onMouseDown, false);
                canvas.addEventListener('touchend', onMouseUp, false);
                canvas.addEventListener('touchcancel', onMouseUp, false);
                canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

                // ! WHITE BORAD END

                streams.push(canvas.captureStream())
                // recordingStream.srcObject = canvas.captureStream()

                // recordingStream.srcObject = 

                // ! CHAT MESSAGE OF JOINING
                appendMessage('You joined')

            }).catch(errorHandler);

    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

// ! Messenger -------------------------------------------------------

function appendMessage(message) {
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    messageContainer.append(messageElement)
}

// ! END Messenger -------------------------------------------------------

// ! START Whiteborad ---------------------------------------------------

function drawLine(x0, y0, x1, y1, color, emit) {
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
        'room': roomID,
        'data': {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            color: color
        }
    });
}

function onMouseDown(e) {
    drawing = true;
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
}

function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
}

function onMouseMove(e) {
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
}

function onColorUpdate(e) {
    current.color = e.target.className.split(' ')[1];
}

// limit the number of events per second
function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
        var time = new Date().getTime();

        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
}

function onDrawingEvent(data) {
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}

// make the canvas fill its parent
function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// ! END Whiteboard ------------------------------------------------------------------

// ! START WEBRTC Signalling ---------------------------------------------------------------

function gotMessageFromServer(message) {
    console.log("-> Got message from server = \n" + message);
    var signal = JSON.parse(message);
    // var signal = message
    console.log("-> Got message : \n" + signal);
    var peerUuid = signal.uuid;
    console.log(peerUuid);
    // Ignore messages that are not for us or from ourselves
    if (peerUuid == localUuid || (signal.dest != localUuid && signal.dest != 'all')) return;

    if (signal.displayName && signal.dest == 'all') {
        // set up peer connection object for a newcomer peer
        setUpPeer(peerUuid, signal.displayName);
        socket.emit("message_from_client", JSON.stringify({ 'displayName': localDisplayName, 'uuid': localUuid, 'dest': peerUuid, 'room': roomID }))
    } else if (signal.displayName && signal.dest == localUuid) {
        // initiate call if we are the newcomer peer
        setUpPeer(peerUuid, signal.displayName, true);

    } else if (signal.sdp) {
        peerConnections[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            // Only create answers in response to offers
            if (signal.sdp.type == 'offer') {
                peerConnections[peerUuid].pc.createAnswer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
            }
        }).catch(errorHandler);

    } else if (signal.ice) {
        peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function setUpPeer(peerUuid, displayName, initCall = false) {
    peerConnections[peerUuid] = { 'displayName': displayName, 'pc': new RTCPeerConnection(peerConnectionConfig) };
    peerConnections[peerUuid].pc.onicecandidate = event => gotIceCandidate(event, peerUuid);
    peerConnections[peerUuid].pc.ontrack = event => gotRemoteStream(event, peerUuid);
    peerConnections[peerUuid].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peerUuid);
    // peerConnections[peerUuid].pc.addStream(localStream);

    localStream.getTracks().forEach((track) => {
        peerConnections[peerUuid].pc.addTrack(track, localStream)
    })

    if (initCall) {
        peerConnections[peerUuid].pc.createOffer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
    }
}

function gotIceCandidate(event, peerUuid) {
    if (event.candidate != null) {
        socket.emit("message_from_client", JSON.stringify({ 'ice': event.candidate, 'uuid': localUuid, 'dest': peerUuid, 'room': roomID }))
    }
}

function createdDescription(description, peerUuid) {
    console.log(`got description, peer ${peerUuid}`);
    peerConnections[peerUuid].pc.setLocalDescription(description).then(function () {
        socket.emit("message_from_client", JSON.stringify({ 'sdp': peerConnections[peerUuid].pc.localDescription, 'uuid': localUuid, 'dest': peerUuid, 'room': roomID }))
    }).catch(errorHandler);
}
let gEvent = []
function gotRemoteStream(event, peerUuid) {

    console.log("EVENT = " + event);
    gEvent.push(event)

    if (event.track.kind == "audio") {

        var sound = document.createElement('audio');

        sound.setAttribute('autoplay', '');
        sound.srcObject = event.streams[0];

        var vidContainer = document.createElement('div');
        vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
        vidContainer.setAttribute('class', 'videoContainer');
        vidContainer.appendChild(sound);
        vidContainer.appendChild(makeLabel(peerConnections[peerUuid].displayName));

        document.getElementById('videos').appendChild(vidContainer);

        updateLayout();

        return
    }

    console.log("hey there");

    streams.push(event.streams[0])

    console.log("STREAM TYPE = " + event.track.kind)

    if (recorder != null) {
        recorder.addStreams(event.streams[0])
    }

    appendMessage("+ " + peerConnections[peerUuid].displayName + 'connected')
    let tmp = document.getElementById('remoteVideo_' + peerUuid)

    // console.log(`got remote stream, peer ${peerUuid}`);
    // console.log("soham : " + event.streams[0]);

    var vidElement = document.createElement('video');
    vidElement.setAttribute('autoplay', '');
    vidElement.srcObject = event.streams[0];

    // var vidContainer = document.createElement('div');
    // vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
    // vidContainer.setAttribute('class', 'videoContainer');
    let vidContainerold = document.getElementById('remoteVideo_' + peerUuid)
    vidContainerold.appendChild(vidElement);
    vidContainerold.appendChild(makeLabel(peerConnections[peerUuid].displayName));

    // document.getElementById('videos').appendChild(vidContainerold);

    updateLayout();
}

function checkPeerDisconnect(event, peerUuid) {
    var state = peerConnections[peerUuid].pc.iceConnectionState;
    console.log(`connection with peer ${peerUuid} ${state}`);
    if (state === "failed" || state === "closed" || state === "disconnected") {
        delete peerConnections[peerUuid];
        document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peerUuid));
        updateLayout();
    }
}

function updateLayout() {
    // update CSS grid based on number of diplayed videos
    var rowHeight = '98vh';
    var colWidth = '98vw';

    var numVideos = Object.keys(peerConnections).length + 1; // add one to include local video

    if (numVideos > 1 && numVideos <= 4) { // 2x2 grid
        rowHeight = '48vh';
        colWidth = '48vw';
    } else if (numVideos > 4) { // 3x3 grid
        rowHeight = '32vh';
        colWidth = '32vw';
    }

    document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
    document.documentElement.style.setProperty(`--colWidth`, colWidth);
}

function makeLabel(label) {
    var vidLabel = document.createElement('div');
    vidLabel.appendChild(document.createTextNode(label));
    vidLabel.setAttribute('class', 'videoLabel');
    return vidLabel;
}

function errorHandler(error) {
    console.log("Error ------------------------------------------\n" + error);
}

function createUUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

// ! END WEBRTC Signalling ---------------------------------------------------------------
