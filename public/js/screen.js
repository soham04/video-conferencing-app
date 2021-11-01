var localUuid_screen;
var localDisplayName_screen;
var localStream_screen;
var socket_screen;
var peerConnections_screen = {};

// ! START and Settup 

function start_screen_share() {

    localUuid_screen = createUUID_screen();

    localDisplayName = 'screen'
    document.getElementById('localVideoContainer').appendChild(makeLabel(localDisplayName_screen));

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
    if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia()
            .then(stream => {
                console.log("Local Stream  = " + stream);
                localStream_screen = stream;
                console.log("Stream objet = " + stream);

                // adding the local stream to the streams array 
                streams.push(stream)

                // document.getElementById('localVideo').srcObject = stream;
            }).catch(errorHandler)

            // set up websocket and message all existing clients
            .then(() => {

                socket_screen = io()
                socket_screen.on("message_from_server", (message) => {
                    gotMessageFromServer(message)
                })

                socket_screen.emit("join", JSON.stringify({ 'displayName': localDisplayName_screen, 'uuid': localUuid_screen, 'dest': 'all', 'room': roomID }))

                // ! CHAT MESSAGE OF JOINING
                appendMessage('You shard screen')

            }).catch(errorHandler);

    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

// ! START WEBRTC Signalling ---------------------------------------------------------------

function gotMessageFromServer(message) {
    console.log("-> Got message from server = \n" + message);
    var signal = JSON.parse(message);
    // var signal = message
    console.log("-> Got message : \n" + signal);
    var peerUuid = signal.uuid;
    console.log(peerUuid);
    // Ignore messages that are not for us or from ourselves
    if (peerUuid == localUuid_screen || (signal.dest != localUuid_screen && signal.dest != 'all')) return;

    if (signal.displayName && signal.dest == 'all') {
        // set up peer connection object for a newcomer peer
        setUpPeer_screen(peerUuid, signal.displayName);
        socket_screen.emit("message_from_client", JSON.stringify({ 'displayName': localDisplayName_screen, 'uuid': localUuid_screen, 'dest': peerUuid, 'room': roomID }))
    } else if (signal.displayName && signal.dest == localUuid_screen) {
        // initiate call if we are the newcomer peer
        setUpPeer_screen(peerUuid, signal.displayName, true);

    } else if (signal.sdp) {
        peerConnections_screen[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            // Only create answers in response to offers
            if (signal.sdp.type == 'offer') {
                peerConnections_screen[peerUuid].pc.createAnswer().then(description => createdDescription_screen(description, peerUuid)).catch(errorHandler);
            }
        }).catch(errorHandler);

    } else if (signal.ice) {
        peerConnections_screen[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function setUpPeer_screen(peerUuid, displayName, initCall = false) {
    peerConnections_screen[peerUuid] = { 'displayName': displayName, 'pc': new RTCPeerConnection(peerConnectionConfig) };
    peerConnections_screen[peerUuid].pc.onicecandidate = event => gotIceCandidate_screen(event, peerUuid);
    // peerConnections_screen[peerUuid].pc.ontrack = event => gotRemoteStream(event, peerUuid);
    // peerConnections_screen[peerUuid].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peerUuid);
    // peerConnections[peerUuid].pc.addStream(localStream);

    localStream_screen.getTracks().forEach((track) => {
        peerConnections_screen[peerUuid].pc.addTrack(track, localStream_screen)
    })

    if (initCall) {
        peerConnections_screen[peerUuid].pc.createOffer().then(description => createdDescription_screen(description, peerUuid)).catch(errorHandler);
    }
}

function gotIceCandidate_screen(event, peerUuid) {
    if (event.candidate != null) {
        socket_screen.emit("message_from_client", JSON.stringify({ 'ice': event.candidate, 'uuid': localUuid_screen, 'dest': peerUuid, 'room': roomID }))
    }
}

function createdDescription_screen(description, peerUuid) {
    console.log(`got description, peer ${peerUuid}`);
    peerConnections_screen[peerUuid].pc.setLocalDescription(description).then(function () {
        socket_screen.emit("message_from_client", JSON.stringify({ 'sdp': peerConnections_screen[peerUuid].pc.localDescription, 'uuid': localUuid_screen, 'dest': peerUuid, 'room': roomID }))
    }).catch(errorHandler);
}

function checkPeerDisconnect_screen(event, peerUuid) {
    var state = peerConnections_screen[peerUuid].pc.iceConnectionState;
    console.log(`connection with peer ${peerUuid} ${state}`);
    if (state === "failed" || state === "closed" || state === "disconnected") {
        delete peerConnections_screen[peerUuid];
        document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peerUuid));
        updateLayout();
    }
}

function updateLayout() {
    // update CSS grid based on number of diplayed videos
    var rowHeight = '98vh';
    var colWidth = '98vw';

    var numVideos = Object.keys(peerConnections_screen).length + 1; // add one to include local video

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

// function makeLabel(label) {
//     var vidLabel = document.createElement('div');
//     vidLabel.appendChild(document.createTextNode(label));
//     vidLabel.setAttribute('class', 'videoLabel');
//     return vidLabel;
// }

function createUUID_screen() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}