const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');
const myIdDisplay = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id-input');
const connectBtn = document.getElementById('connect-btn');

// Game State
const p1 = { x: 100, y: 200, color: 'cyan', size: 30 }; // Host Player
const p2 = { x: 450, y: 200, color: 'magenta', size: 30 }; // Guest Player
let myRole = null; // Will be 'host' or 'guest'
let conn = null; // Holds the network connection

// Initialize PeerJS explicitly over secure HTTPS/WSS for GitHub Pages
const peer = new Peer({
    host: '://peerjs.com',
    port: 443,
    path: '/',
    secure: true
});

// Successfully connected to network server: Show your unique ID
peer.on('open', (id) => {
    myIdDisplay.textContent = id;
    statusText.textContent = "Share your ID or enter a friend's ID to start.";
});

// Error tracking: Show exactly what went wrong directly on screen
peer.on('error', (err) => {
    console.error(err);
    statusText.textContent = "Error: " + err.type + " - " + err.message;
    statusText.style.color = "#ff4d4d";
});

// Case A: You are the Host (Someone else connects to you)
peer.on('connection', (incomingConn) => {
    if (conn) return; // Ignore if already playing
    conn = incomingConn;
    myRole = 'host';
    setupConnection();
});

// Case B: You are the Guest (You initiate the connection)
connectBtn.addEventListener('click', () => {
    const peerId = peerIdInput.value.trim();
    if (peerId && !conn) {
        statusText.textContent = "Connecting...";
        conn = peer.connect(peerId);
        myRole = 'guest';
        setupConnection();
    }
});

// Handle data streaming once connected
function setupConnection() {
    conn.on('open', () => {
        statusText.textContent = `Connected! You are the ${myRole.toUpperCase()}.`;
        document.getElementById('setup').style.border = "2px solid #28a745";
        gameLoop();
    });

    conn.on('data', (data) => {
        // Receive the other player's position over the network
        if (myRole === 'host') {
            p2.x = data.x;
            p2.y = data.y;
        } else if (myRole === 'guest') {
            p1.x = data.x;
            p1.y = data.y;
        }
    });

    conn.on('close', () => {
        statusText.textContent = "Player disconnected.";
        conn = null;
    });
}

// Track local keyboard movement
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function updatePosition() {
    let moved = false;
    const speed = 4;
    const activePlayer = (myRole === 'host') ? p1 : p2;

    if (keys['ArrowUp'] || keys['KeyW']) { activePlayer.y -= speed; moved = true; }
    if (keys['ArrowDown'] || keys['KeyS']) { activePlayer.y += speed; moved = true; }
    if (keys['ArrowLeft'] || keys['KeyA']) { activePlayer.x -= speed; moved = true; }
    if (keys['ArrowRight'] || keys['KeyD']) { activePlayer.x += speed; moved = true; }

    // Send coordinates to peer if you moved
    if (moved && conn && conn.open) {
        conn.send({ x: activePlayer.x, y: activePlayer.y });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Host Box
    ctx.fillStyle = p1.color;
    ctx.fillRect(p1.x, p1.y, p1.size, p1.size);
    
    // Draw Guest Box
    ctx.fillStyle = p2.color;
    ctx.fillRect(p2.x, p2.y, p2.size, p2.size);
}

function gameLoop() {
    updatePosition();
    draw();
    requestAnimationFrame(gameLoop);
}
