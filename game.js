<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>P2P GitHub Pages Game</title>
    <style>
        body { font-family: sans-serif; text-align: center; background: #222; color: #fff; margin: 0; padding: 20px; }
        #setup { margin-bottom: 20px; background: #333; padding: 15px; border-radius: 8px; display: inline-block; }
        input, button { padding: 8px; font-size: 16px; margin: 5px; border-radius: 4px; border: none; }
        button { background: #28a745; color: white; cursor: pointer; }
        button:hover { background: #218838; }
        canvas { background: #000; border: 3px solid #fff; display: block; margin: 20px auto; }
        #status { color: #ffc107; font-weight: bold; }
    </style>
    <!-- Include PeerJS Library -->
    <script src="https://unpkg.com"></script>
</head>
<body>

    <h1>Online P2P Multi-player Game</h1>
    
    <div id="setup">
        <p>Your ID: <span id="my-id">Generating...</span></p>
        <input type="text" id="peer-id-input" placeholder="Paste Friend's ID here">
        <button id="connect-btn">Connect to Friend</button>
        <p id="status">Waiting for connection...</p>
    </div>

    <canvas id="gameCanvas" width="600" height="400"></canvas>

    <script src="game.js"></script>
</body>
// Error catching listener
peer.on('error', (err) => {
    console.error(err);
    statusText.textContent = "Error: " + err.type + " - " + err.message;
    statusText.style.color = "#ff4d4d";
});


        
</html>
