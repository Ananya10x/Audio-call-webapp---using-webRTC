let peer;
let currentCall;
let localStream;
let username = '';
let isMuted = false;

const setUsernameBtn = document.getElementById('setUsernameBtn');
const usernameInput = document.getElementById('username');
const myIdDisplay = document.getElementById('myId');
const callBtn = document.getElementById('callBtn');
const hangupBtn = document.getElementById('hangupBtn');
const remoteIdInput = document.getElementById('remoteId');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const statusDiv = document.getElementById('status');
const callLogDiv = document.getElementById('callLog');

setUsernameBtn.addEventListener('click', setUsername);
callBtn.addEventListener('click', startCall);
hangupBtn.addEventListener('click', endCall);
muteBtn.addEventListener('click', toggleMute);
volumeSlider.addEventListener('input', adjustVolume);

function setUsername() {
    username = usernameInput.value.trim();
    if (username) {
        initializePeer();
        setUsernameBtn.disabled = true;
        usernameInput.disabled = true;
        updateStatus(`Username set to: ${username}`);
    } else {
        updateStatus('Please enter a valid username');
    }
}

function initializePeer() {
    peer = new Peer(username);
    
    peer.on('open', (id) => {
        myIdDisplay.textContent = `Your ID: ${id}`;
        callBtn.disabled = false;
        updateStatus('Peer connection established. You can now make calls.');
    });

    peer.on('call', (call) => {
        const acceptCall = confirm(`Incoming call from ${call.peer}. Accept?`);
        if (acceptCall) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                .then((stream) => {
                    localStream = stream;
                    call.answer(stream);
                    handleCall(call);
                })
                .catch((err) => {
                    console.error('Failed to get local stream', err);
                    updateStatus('Failed to get local stream');
                });
        } else {
            call.close();
            updateStatus(`Rejected call from ${call.peer}`);
        }
    });

    peer.on('error', (err) => {
        console.error(err);
        updateStatus(`Error: ${err.type}`);
    });
}

function startCall() {
    const remoteId = remoteIdInput.value.trim();
    if (remoteId) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then((stream) => {
                localStream = stream;
                const call = peer.call(remoteId, stream);
                handleCall(call);
            })
            .catch((err) => {
                console.error('Failed to get local stream', err);
                updateStatus('Failed to get local stream');
            });
    } else {
        updateStatus('Please enter a valid remote ID');
    }
}

function handleCall(call) {
    currentCall = call;
    hangupBtn.disabled = false;
    muteBtn.disabled = false;
    volumeSlider.disabled = false;
    callBtn.disabled = true;

    call.on('stream', (remoteStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
        volumeSlider.addEventListener('input', () => adjustVolume(audio));
    });

    call.on('close', () => {
        endCall();
    });

    updateStatus(`Connected to ${call.peer}`);
    logCall('outgoing', call.peer);
}

function endCall() {
    if (currentCall) {
        currentCall.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    currentCall = null;
    localStream = null;
    hangupBtn.disabled = true;
    muteBtn.disabled = true;
    volumeSlider.disabled = true;
    callBtn.disabled = false;
    updateStatus('Call ended');
}

function toggleMute() {
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        isMuted = !isMuted;
        muteBtn.innerHTML = isMuted ? '<i class="fas fa-microphone-slash"></i> Unmute' : '<i class="fas fa-microphone"></i> Mute';
        updateStatus(isMuted ? 'Muted' : 'Unmuted');
    }
}

function adjustVolume(audio) {
    if (audio) {
        audio.volume = volumeSlider.value;
    }
}

function updateStatus(message) {
    statusDiv.textContent = message;
}

function logCall(type, peerId) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `${type === 'incoming' ? 'Incoming' : 'Outgoing'} call ${type === 'incoming' ? 'from' : 'to'} ${peerId} at ${new Date().toLocaleString()}`;
    callLogDiv.appendChild(logEntry);
}