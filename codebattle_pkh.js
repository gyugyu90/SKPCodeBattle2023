class {

  /**
   * 코드는 JAVASCRIPT 로 작성해 주시고, 위의 첫줄과 on...() 메소드의 이름은 변경하지 말아주세요.
   */

  /**
   * 플레이어의 이름 또는 닉네임을 입력해 주세요.
   * 그대로 두면 Player1 또는 Player2로 replace 됩니다.
   * player_name은 printLog 할때 누구의 로그인지를 구분하기 위해 사용할 수 있고,
   * TURN / ROUND / SET(GAME) 현황판에 표시됩니다.
   */
  player_name = "PKH";

  /**
   * 게임이 시작되면 호출됩니다.
   * 게임 중에 사용할 변수들의 초기화를 여기서 합니다.
   */
  onGameStart() {
    // printLog(string)는 플레이 영역 하단의 게임 로그 영역에 텍스트를 출력하는 함수입니다.
    printLog(this.player_name + ": onGameStart!");
  }

  /**
   * 세트가 시작되면 호출됩니다.
   * 1번의 게임은 최대 99번의 세트를 실행합니다.
   * 
   * @param data
   *   data.my_coins: 나의 코인 보유 수량
   */
  onSetStart(data) {
    printLog(
      this.player_name + ": onSetStart! my_coins:" + data.my_coins
    );
  }

  myWinningPercentage = 0.5;
  myTurnIsFirst = false;
  isInitialBet = true;
  isSame1Digit = false;

  /**
   * 라운드가 시작되면 호출됩니다.
   * 한번의 라운드는 한판을 의미하며, 그 한판을 위해 필요한 정보들을 받습니다.
   * 
   * @param data
   *   data.my_coins: 나의 코인 보유 수량.
   *   data.op_coins: 상대방의 코인 보유 수량.
   *   data.my_cards: 나의 카드 2장의 번호. [첫번째 번호, 두번째 번호]
   *   data.op_card: 상대방의 카드 1장의 번호.
   *   data.first_turn: 내가 첫 턴인지 여부. true/false
   *   data.remain_round_count: 
   *     이번 세트의 남은 라운드 수. 0이면 이번 세트의 마지막 라운드임을 의미하고, 
   *     라운드가 끝난 후 남은 코인 수가 많은 플레이어가 세트의 승자가 됩니다.
   */
  onRoundStart(data) {
    printLog(
      this.player_name + ": onRoundStart!"
      + " my_coins:" + data.my_coins + ", op_coins:" + data.op_coins
      + ", my_cards:[" + data.my_cards[0] + "," + data.my_cards[1] + "]"
      + ", op_card:" + data.op_card + ", first_turn:" + data.first_turn
      + ", remain_round_count:" + data.remain_round_count
    );

    this.myWinningPercentage = this.calculateWinningPercentage(data.my_cards[0], data.my_cards[1], data.op_card);
    this.myTurnIsFirst = data.first_turn;
    this.isInitialBet = true;
    printLog("승률: " + Math.round(this.myWinningPercentage * 100) / 100);
  }

  calculateWinningPercentage(myCard1, myCard2, opCard) {
    this.isSame1Digit = myCard1 % 10 === myCard2 % 10;
    if (myCard1 % 10 === myCard2 % 10) {
      if ((myCard1 % 10) > (opCard % 10)) {
        return 1;
      }

      return 0.94;
    }

    var myValue = (myCard1 + myCard2) % 10;
    var myBiggerNumber = this.getBiggerNumber(myCard1, myCard2);

    var winningCase = 0;
    for (var opHidden = 1; opHidden <= 20; opHidden++) {
      if (myCard1 === opHidden || myCard2 === opHidden || opCard === opHidden) {
        continue;
      }

      var opValue = (opCard + opHidden) % 10;
      if (myValue > opValue) {
        winningCase++;
        continue;
      }

      if (myValue === opValue && myBiggerNumber > this.getBiggerNumber(opCard, opHidden)) {
        winningCase++;
      }
    }
    return winningCase / 17;
  }

  getBiggerNumber(num1, num2) {
    if (num1 >= num2) {
      return num1;
    }

    return num2;
  }

  getSmallerNumber(num1, num2) {
    if (num1 <= num2) {
      return num1;
    }

    return num2;
  }

  generateRandom(min = 0, max = 100) {
    let difference = max - min;
    let rand = Math.random(); 
    rand = Math.floor(rand * difference);
    rand = rand + min;

    return rand;
  }

  /**
   * 턴이 시작되면 호출됩니다.
   * 상대가 베팅한 코인의 수를 보고 내가 얼마를 베팅할 것인지를 정하여 리턴합니다.
   * 
   * @param data
   *   data.my_coins: 나의 현재 코인 보유 수량.
   *   data.op_coins: 상대방의 현재 코인 보유 수량.
   *   data.my_bet_coins: 내가 베팅한 코인 수.(내가 아직 베팅하지 않았으면 10)
   *   data.op_bet_coins: 상대가 베팅한 코인 수.(상대가 아직 베팅하지 않았으면 10)
   * 
   * @result -1 또는 이번 라운드에 베팅할 코인의 수
   *   data.op_bet_coins 이상 data.my_coins 이하의 수를 리턴할 수 있습니다.
   *   -1 이거나, 위 조건에 맞지 않는 값을 리턴할 경우, 이번 라운드를 포기하게 되고, data.my_bet_coins만큼이 상대에게 넘어갑니다.
   */
  onTurnStart(data) {
    let result = -1;

    if (this.myWinningPercentage < 0.5) {
      result = -1;
    }

    var budget = this.getSmallerNumber(data.my_coins, data.op_coins)

    if (this.myTurnIsFirst && this.isInitialBet) {
      this.isInitialBet = false;
      if (this.myWinningPercentage === 1) {
        result = Math.floor(budget * this.generateRandom(85, 95) / 100);
      } else if (this.myWinningPercentage > 0.9 && this.isSame1Digit) {
        result = Math.floor(budget * this.generateRandom(65, 85) / 100);
      } else if (this.myWinningPercentage > 0.9 && !this.isSame1Digit) {
        result = Math.floor(budget * this.generateRandom(5, 15) / 100);
      } else {
        result = Math.floor(this.getBiggerNumber(data.my_coins, data.op_coins) * 0.005);
      }
    } else {
      if (this.myWinningPercentage > 0.9) {
        if (data.op_bet_coins < Math.floor(budget * 0.7)) {
          result = Math.floor(budget * this.generateRandom(65, 75) / 100)
        } else {
          result = data.op_bet_coins;
        }
      }

      if (this.myWinningPercentage < 0.5 && data.op_bet_coins > Math.floor(data.my_coins * this.myWinningPercentage) * 0.5) {
        result = -1;
      } else if (this.myWinningPercentage > 0.5 && this.myWinningPercentage < 0.9
        && data.op_bet_coins > Math.floor(data.my_coins * this.myWinningPercentage) * 0.5) {
        result = -1;
      } else {
        result = data.op_bet_coins;
      }
    }

    printLog(
      this.player_name + ": onTurnStart! "
      + "my_coins: " + data.my_coins + ", op_coins: " + data.op_coins
      + ", my_bet_coins: " + data.my_bet_coins + ", op_bet_coins: " + data.op_bet_coins
      + ", result: " + result
    );
    return result;
  }

  /**
   * 라운드가 끝나면 호출되며, 라운드의 결과를 받아봅니다.
   * 두 플레이어의 베팅 코인 수가 같아지거나, 한쪽이 베팅을 포기하면, 라운드가 종료되며 누군가는 코인을 획득합니다.
   * 
   * @param result
   *   result.win: -1(졌을때) or 0(비겼을때) or 1(이겼을때)
   *   result.my_coins: 나의 코인 보유 수량.
   *   result.op_coins: 상대방의 코인 보유 수량.
   *   result.op_cards: 상대방의 카드 2장의 번호. [첫번째 번호, 두번째 번호(상대 또는 내가 라운드를 포기한 경우는 0)]
   */
  onRoundEnd(result) {
    printLog(
      this.player_name + ": onRoundEnd! win:" + result.win
      + ", my_coins:" + result.my_coins + ", op_coins:" + result.op_coins
      + ", op_cards:[" + result.op_cards[0] + "," + result.op_cards[1] + "]"
    );
  }

  /**
   * 세트가 끝나면 호출되며, 세트의 결과를 받아봅니다.
   * 나 또는 상대방의 코인이 모두 소진되거나, 200 라운드가 실행된 경우에, 세트가 끝납니다.
   * 
   * @param result
   *   result.win: -1(졌을때) or 0(비겼을때) or 1(이겼을때)
   *   result.my_coins: 나의 코인 보유 수량.
   *   result.op_coins: 상대방의 코인 보유 수량.
   */
  onSetEnd(result) {
    printLog(
      this.player_name + ": onSetEnd! win:" + result.win
      + ", my_coins:" + result.my_coins + ", op_coins:" + result.op_coins
    );
  }

  /**
   * 게임이 끝나면 호출되며, 게임의 결과를 받아봅니다.
   * 
   * @param result
   *   result.win: -1(졌을때) or 0(비겼을때) or 1(이겼을때)
   */
  onGameEnd(result) {
    printLog(this.player_name + ": onGameEnd! win:" + result.win);
  }
}
