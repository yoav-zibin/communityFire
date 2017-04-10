var communityFire;
(function (communityFire) {
    var main;
    (function (main) {
        // TODO: change to your own Firebase URL! To avoid messing up the data for other students.
        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyDvbUblHfA5eJe5sK1Xy-xC_tfV4y4PgQE",
            authDomain: "signalling-d073b.firebaseapp.com",
            databaseURL: "https://signalling-d073b.firebaseio.com",
            storageBucket: "signalling-d073b.appspot.com",
            messagingSenderId: "308144322392"
        };
        firebase.initializeApp(config);
        main.matches = [];
        // Saving as json because firebase has restriction on keys (and we use "data: any").
        // Example error: Firebase.set failed: First argument  contains an invalid key (playerId0.5446834512026781) in property 'matches.0.playerIdToProposal'.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"
        // Another weird thing: For some reason firebase stores "{}" as null (for playerIdToProposal).
        // Some teams corrupted the data, so I changed the ref name.
        var matchesRef = firebase.database().ref("matchesJson5");
        matchesRef.on('value', function (snapshot) {
            communityFire.$timeout(function () {
                var matchesJson = snapshot.val();
                communityFire.log.info("matchesJson=", matchesJson);
                if (!matchesJson) {
                    main.matches = createCommunityMatches();
                    storeMatches();
                }
                else {
                    main.matches = angular.fromJson(matchesJson);
                    if (showGameIframe())
                        sendCommunityUI();
                }
            });
        });
        main.indexToChatMsgs = [];
        var chatRef = firebase.database().ref("indexToChatMsgs");
        chatRef.on('value', function (snapshot) {
            communityFire.$timeout(function () {
                main.indexToChatMsgs = snapshot.val();
                communityFire.log.info("indexToChatMsgs=", main.indexToChatMsgs);
                if (!main.indexToChatMsgs)
                    main.indexToChatMsgs = [];
            });
        });
        function getChatMsgs() {
            return main.indexToChatMsgs[currentMatchIndex] ? main.indexToChatMsgs[currentMatchIndex] : [];
        }
        main.getChatMsgs = getChatMsgs;
        main.myCommunityPlayerIndex = location.search.indexOf('playBlack') != -1 ? 0 :
            location.search.indexOf('playWhite') != -1 ? 1 :
                Math.random() > 0.5 ? 0 : 1;
        main.myPlayerInfo = location.protocol == "file:" ? {
            avatarImageUrl: "http://graph.facebook.com/10154287448416125/picture?square=square",
            displayName: "Test player " + Math.floor(1000 * Math.random()),
            playerId: "playerId" + Math.random()
        } : null;
        function storeMatches() {
            matchesRef.set(angular.toJson(main.matches));
        }
        function storeChat() {
            chatRef.set(main.indexToChatMsgs);
        }
        function createCommunityMatches() {
            return [
                createCommunityMatch(),
                createCommunityMatch(),
                createCommunityMatch(),
                createCommunityMatch(),
            ];
        }
        function createCommunityMatch() {
            return {
                endMatchScores: null,
                turnIndex: 0,
                state: null,
            };
        }
        function isInPage(page) {
            if (page.charAt(0) !== '/') {
                throw new Error("page must start with '/', but got page=" + page);
            }
            return location.hash.indexOf('#' + page) === 0;
        }
        main.isInPage = isInPage;
        function isInPagePlayGame() {
            return isInPage("/playGame/");
        }
        function showGameIframe() {
            return isInPagePlayGame() && communityFire.messageSender.didGetGameReady();
        }
        main.showGameIframe = showGameIframe;
        function changePage(hash) {
            var currentLocation = location.hash.substring(1); // to remove "#"
            communityFire.log.info("changePage from " + currentLocation + " to " + hash);
            if (currentLocation === hash) {
                return;
            }
            communityFire.$location.path(hash);
            window.scrollTo(0, 0);
        }
        main.changePage = changePage;
        function gotoPlayPage(matchIndex) {
            changePage('/playGame/' + matchIndex);
        }
        main.gotoPlayPage = gotoPlayPage;
        function gotoMainPage() {
            changePage('/main');
        }
        main.gotoMainPage = gotoMainPage;
        main.chatMessage = "";
        function sendChat() {
            addChatMsg({ chat: main.chatMessage, fromPlayer: main.myPlayerInfo });
            main.chatMessage = "";
        }
        main.sendChat = sendChat;
        function addChatMsg(chatMsg) {
            if (!main.indexToChatMsgs[currentMatchIndex])
                main.indexToChatMsgs[currentMatchIndex] = [];
            var chatMsgs = main.indexToChatMsgs[currentMatchIndex];
            chatMsgs.unshift(chatMsg);
            if (chatMsgs.length > 100)
                chatMsgs.pop();
            storeChat();
        }
        main.isChatShowing = false;
        function toggleChat() {
            main.isChatShowing = !main.isChatShowing;
        }
        main.toggleChat = toggleChat;
        function isYourTurn(match) {
            return match.turnIndex == main.myCommunityPlayerIndex &&
                !match.playerIdToProposal[main.myPlayerInfo.playerId];
        }
        main.isYourTurn = isYourTurn;
        var currentMatchIndex = null;
        function getCurrentMatch() {
            return main.matches[currentMatchIndex];
        }
        main.getCurrentMatch = getCurrentMatch;
        function loadMatch(matchIndex) {
            var match = main.matches[matchIndex];
            if (!match || !main.myPlayerInfo) {
                communityFire.log.warn("Couldn't find matchIndex=", matchIndex);
                changePage('/main');
                return;
            }
            currentMatchIndex = matchIndex;
            sendCommunityUI();
        }
        main.loadMatch = loadMatch;
        var lastUpdateUI = null;
        function sendCommunityUI() {
            var move = main.matches[currentMatchIndex];
            var updateUI = {
                endMatchScores: move.endMatchScores,
                turnIndex: move.turnIndex,
                state: move.state,
                numberOfPlayers: 2,
                playerIdToProposal: {},
                numberOfPlayersRequiredToMove: 1,
                playersInfo: [],
                playMode: main.myCommunityPlayerIndex,
                yourPlayerIndex: main.myCommunityPlayerIndex,
                yourPlayerInfo: main.myPlayerInfo,
            };
            communityFire.log.info("sendCommunityUI: ", updateUI);
            lastUpdateUI = updateUI;
            communityFire.messageSender.sendToGame({ updateUI: updateUI });
        }
        window.addEventListener("message", function (event) {
            var game_iframe = window.document.getElementById("game_iframe");
            if (!game_iframe || game_iframe.contentWindow !== event.source) {
                return;
            }
            communityFire.$rootScope.$apply(function () {
                var message = event.data;
                communityFire.log.info("Platform got message:", message);
                if (message.gameReady) {
                    if (communityFire.messageSender.didGetGameReady()) {
                        communityFire.log.warn("Game sent gameReady before (look at the logs)! You can only send gameReady once.");
                        return;
                    }
                    communityFire.messageSender.gotGameReady();
                    return;
                }
                var move = message.move;
                //let proposal: IProposal = message.proposal;
                if (!angular.equals(message.lastMessage.updateUI, lastUpdateUI)) {
                    communityFire.log.error("This move belongs to an old communityUI! lastUpdateUI=\n" +
                        angular.toJson(lastUpdateUI, true) + " message.lastMessage.updateUI=\n" +
                        angular.toJson(message.lastMessage.updateUI, true));
                    return;
                }
                var match = main.matches[currentMatchIndex];
                var chatMsg = { chat: "Played a move", fromPlayer: main.myPlayerInfo };
                addChatMsg(chatMsg);
                match.turnIndex = move.turnIndex;
                match.state = move.state;
                match.endMatchScores = move.endMatchScores;
                storeMatches();
                sendCommunityUI();
            });
        });
        function googleLogin() {
            var provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/plus.login');
            firebase.auth().signInWithPopup(provider).then(function (result) {
                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken;
                // The signed-in user info.
                var user = result.user;
                communityFire.log.info("Google login succeeded: ", token, user);
            }).catch(function (error) {
                communityFire.log.error("Google login failed: ", error);
            });
        }
        main.googleLogin = googleLogin;
        firebase.auth().onAuthStateChanged(function (user) {
            if (!user)
                return;
            // User is signed in.
            main.myPlayerInfo = {
                avatarImageUrl: user.photoURL,
                displayName: user.displayName,
                playerId: user.uid,
            };
            communityFire.log.alwaysLog("myPlayerInfo=", main.myPlayerInfo);
            if (communityFire.$rootScope)
                communityFire.$rootScope.$apply();
        });
        angular.module('MyApp', ['ngMaterial', 'ngRoute'])
            .config(['$routeProvider', function ($routeProvider) {
                $routeProvider.
                    when('/main', {
                    templateUrl: 'html-templates/mainPage.html',
                    controller: ''
                }).
                    when('/playGame/:matchIndex', {
                    templateUrl: 'html-templates/playPage.html',
                    controller: 'PlayGameCtrl'
                }).
                    otherwise({
                    redirectTo: '/main'
                });
            }])
            .controller('PlayGameCtrl', ['$routeParams',
            function ($routeParams) {
                var matchIndex = $routeParams["matchIndex"];
                communityFire.log.info("PlayGameCtrl matchIndex=", matchIndex);
                loadMatch(matchIndex);
            }])
            .run([
            '$timeout', '$interval',
            '$interpolate',
            '$http',
            '$location',
            '$rootScope',
            '$route',
            '$sce',
            '$templateCache',
            function (_timeout, _interval, _interpolate, _http, _location, _rootScope, _route, _sce, _templateCache) {
                if (_templateCache.get('html-templates/mainPage.html')) {
                    communityFire.log.error("Missing html-templates/mainPage.html in $templateCache");
                }
                communityFire.$timeout = _timeout;
                communityFire.$interval = _interval;
                communityFire.$interpolate = _interpolate;
                communityFire.$http = _http;
                communityFire.$location = _location;
                communityFire.$rootScope = _rootScope;
                communityFire.$route = _route;
                communityFire.$sce = _sce; // It's module-specific, or else I get: Error: [$sce:unsafe] Attempting to use an unsafe value in a safe context.
                communityFire.log.alwaysLog("Angular loaded!");
                communityFire.$rootScope['main'] = main;
            }
        ]);
    })(main = communityFire.main || (communityFire.main = {}));
})(communityFire || (communityFire = {}));
//# sourceMappingURL=main.js.map