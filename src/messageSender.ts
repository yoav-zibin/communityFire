// Sends messages to game iframe (and buffers these messages until the game sends GameReady)
namespace gamingPlatform {
export module messageSender {
  let waitingMsgs: any[] = [];
  let gameIsReady: boolean = false;

  export function sendToGame(msg: any): void {
    // If not ready, then we'll send it later
    if (!canPassMessages()) {
      log.info("After getting gameReady, we will send: ", msg);
      waitingMsgs.push(msg);
      return;
    }
    passMessage(msg);
  }

  function passMessage(msg: any): void {
    log.info("Platform sent to game: ", msg);
    let iframe = <HTMLIFrameElement> window.document.getElementById("game_iframe");
    iframe.contentWindow.postMessage(msg, "*");
  }
  
  function maybePassMessages() {
    if (!canPassMessages() || waitingMsgs.length === 0) return;
    for (let msg of waitingMsgs) {
      passMessage(msg);
    }
    waitingMsgs = [];
  }

  export function gotGameReady(): void {
    if (gameIsReady) {
      console.error("Game sent GameReady more than once!");
      return;
    }
    gameIsReady = true;
    maybePassMessages();
  }

  export function didGetGameReady(): boolean {
    return gameIsReady;
  }
  
  function canPassMessages() {
    return gameIsReady;
  }
}
}
