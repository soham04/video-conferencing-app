var localUuid_screen;
let localDisplayName_screen;

// ! START and Settup 

function startScreenShare() {

    localUuid_screen = createUUID();

    localDisplayName_screen = localDisplayName + "\' s Screen "//prompt('Enter your name', '');
    // document.getElementById('localVideoContainer').appendChild(makeLabel(localDisplayName));

    // set up local video stream
    if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia()
            .then(stream => {
                console.log("Local Stream  = " + stream);
                localStream = stream;
                console.log("Stream objet = " + stream);

                // adding the local stream to the streams array 
                streams.push(stream)

                // stopStream.addEventListener('click', e => {
                //     e.preventDefault()
                //     // alert("clicked")
                //     console.log("stop stream");
                //     // stream.getVideoTracks()[0].stop()
                //     stream.getVideoTracks()[0].enabled = false
                // })

                // startStream.addEventListener('click', e => {
                //     e.preventDefault()
                //     // alert("clicked")
                //     console.log("resume stream");
                //     // stream.getVideoTracks()[0].stop()
                //     stream.getVideoTracks()[0].enabled = true
                // })

                // document.getElementById('localVideo').srcObject = stream;
            }).catch(errorHandler)

            // set up websocket and message all existing clients
            .then(() => {

                // socket.on("message_from_server", (message) => {
                //     gotMessageFromServer(message)
                // })

                socket.emit("join", JSON.stringify({ 'displayName': localDisplayName_screen, 'uuid': localUuid_screen, 'dest': 'all', 'room': roomID }))

                           // ! CHAT MESSAGE OF JOINING
                appendMessage('You joined')

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
        setUpPeer(peerUuid, signal.displayName);
        socket.emit("message_from_client_screen", JSON.stringify({ 'displayName': localDisplayName, 'uuid': localUuid_screen, 'dest': peerUuid, 'room': roomID }))
    } else if (signal.displayName && signal.dest == localUuid_screen) {
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
    // peerConnections[peerUuid].pc.ontrack = event => gotRemoteStream(event, peerUuid);
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
        socket.emit("message_from_client_screen", JSON.stringify({ 'ice': event.candidate, 'uuid': localUuid_screen, 'dest': peerUuid, 'room': roomID }))
    }
}

function createdDescription(description, peerUuid) {
    console.log(`got description, peer ${peerUuid}`);
    peerConnections[peerUuid].pc.setLocalDescription(description).then(function () {
        socket.emit("message_from_client_screen", JSON.stringify({ 'sdp': peerConnections[peerUuid].pc.localDescription, 'uuid': localUuid_screen, 'dest': peerUuid, 'room': roomID }))
    }).catch(errorHandler);
}
