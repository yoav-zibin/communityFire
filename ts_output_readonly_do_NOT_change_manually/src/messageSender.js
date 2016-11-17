// Sends messages to game iframe (and buffers these messages until the game sends GameReady)
var gamingPlatform;
(function (gamingPlatform) {
    var messageSender;
    (function (messageSender) {
        var waitingMsgs = [];
        var gameIsReady = false;
        function sendToGame(msg) {
            // If not ready, then we'll send it later
            if (!canPassMessages()) {
                gamingPlatform.log.info("After getting gameReady, we will send: ", msg);
                waitingMsgs.push(msg);
                return;
            }
            passMessage(msg);
        }
        messageSender.sendToGame = sendToGame;
        function passMessage(msg) {
            gamingPlatform.log.info("Platform sent to game: ", msg);
            var iframe = window.document.getElementById("game_iframe");
            iframe.contentWindow.postMessage(msg, "*");
        }
        function maybePassMessages() {
            if (!canPassMessages() || waitingMsgs.length === 0)
                return;
            for (var _i = 0, waitingMsgs_1 = waitingMsgs; _i < waitingMsgs_1.length; _i++) {
                var msg = waitingMsgs_1[_i];
                passMessage(msg);
            }
            waitingMsgs = [];
        }
        function gotGameReady() {
            if (gameIsReady) {
                console.error("Game sent GameReady more than once!");
                return;
            }
            gameIsReady = true;
            maybePassMessages();
        }
        messageSender.gotGameReady = gotGameReady;
        function didGetGameReady() {
            return gameIsReady;
        }
        messageSender.didGetGameReady = didGetGameReady;
        function canPassMessages() {
            return gameIsReady;
        }
    })(messageSender = gamingPlatform.messageSender || (gamingPlatform.messageSender = {}));
})(gamingPlatform || (gamingPlatform = {}));
//# sourceMappingURL=messageSender.js.map