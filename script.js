let peer;
let call;

const remoteIdInput = document.getElementById('remoteId');
const callBtn = document.getElementById('callBtn');
const hangupBtn = document.getElementById('hangupBtn');
const status = document.getElementById('status');

// Initialize PeerJS
function init() {
    peer = new Peer();

    peer.on('open', (id) => {
        status.textContent = `Your ID: ${id}`;
    });

    peer.on('call', (incomingCall) => {
        call = incomingCall;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                call.answer(stream);
                handleCall();
            })
            .catch((err) => {
                console.error('Failed to get local stream', err);
            });
    });
}

// Start a call
callBtn.addEventListener('click', () => {
    const remoteId = remoteIdInput.value;
    if (remoteId) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                call = peer.call(remoteId, stream);
                handleCall();
            })
            .catch((err) => {
                console.error('Failed to get local stream', err);
            });
    } else {
        alert('Please enter a remote user ID');
    }
});

// Handle the call
function handleCall() {
    call.on('stream', (remoteStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
    });

    callBtn.disabled = true;
    hangupBtn.disabled = false;
    status.textContent = 'Call connected';
}

// Hang up the call
hangupBtn.addEventListener('click', () => {
    if (call) {
        call.close();
        call = null;
        callBtn.disabled = false;
        hangupBtn.disabled = true;
        status.textContent = 'Call ended';
    }
});

// Initialize the app
init();