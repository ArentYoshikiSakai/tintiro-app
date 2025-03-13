import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Player, 
  GameState, 
  GamePhase, 
  DiceRoll, 
  DiceHold,
  Yaku,
  YakuType,
  DiceValue
} from '../types/game';
import { 
  rollThreeDice, 
  determineYaku, 
  determineWinner, 
  calculatePayout 
} from '../utils/gameLogic';

// ゲームの初期プレイヤー設定
const createInitialPlayers = (numPlayers: number = 2): Player[] => {
  const players: Player[] = [];
  
  // 親プレイヤーを作成
  const parentId = uuidv4();
  players.push({
    id: parentId,
    name: '親',
    isParent: true,
    chips: 1000,
    betAmount: 0,
    diceRoll: null,
    yaku: null,
    rollCount: 0,
    diceHold: [false, false, false],
    rollConfirmed: false
  });
  
  // 子プレイヤーを作成
  for (let i = 1; i < numPlayers; i++) {
    players.push({
      id: uuidv4(),
      name: `プレイヤー${i}`,
      isParent: false,
      chips: 1000,
      betAmount: 0,
      diceRoll: null,
      yaku: null,
      rollCount: 0,
      diceHold: [false, false, false],
      rollConfirmed: false
    });
  }
  
  return players;
};

// 初期ゲーム状態
const createInitialGameState = (numPlayers: number = 2): GameState => {
  const players = createInitialPlayers(numPlayers);
  const parentId = players.find(player => player.isParent)?.id || '';
  
  // 最初は子プレイヤーから始める（賭け金設定フェーズのため）
  const firstChildId = players.find(player => !player.isParent)?.id || '';
  
  return {
    players,
    currentPlayerId: firstChildId, // 最初は子プレイヤーから
    parentId,
    phase: GamePhase.BETTING,
    round: 1
  };
};

// 単一のサイコロを振る関数
const rollSingleDice = (): DiceValue => {
  return Math.floor(Math.random() * 6 + 1) as DiceValue;
};

// ゲーム状態管理フック
export const useGameState = (numPlayers: number = 2) => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState(numPlayers));
  
  // 賭け金を設定する関数
  const placeBet = useCallback((playerId: string, amount: number) => {
    setGameState(prevState => {
      const updatedPlayers = prevState.players.map(player => {
        if (player.id === playerId) {
          // 賭け金が所持チップを超えないようにする
          const betAmount = Math.min(amount, player.chips);
          return {
            ...player,
            betAmount,
            chips: player.chips - betAmount
          };
        }
        return player;
      });
      
      // 全員が賭け金を設定したかチェック
      const allPlayersBet = updatedPlayers.every(player => 
        player.isParent || player.betAmount > 0
      );
      
      // 次のプレイヤーを探す
      let nextPlayerId = prevState.currentPlayerId;
      
      // 現在のプレイヤーのインデックスを取得
      const currentPlayerIndex = updatedPlayers.findIndex(
        player => player.id === playerId
      );
      
      // 次の子プレイヤーを探す
      if (currentPlayerIndex !== -1) {
        for (let i = currentPlayerIndex + 1; i < updatedPlayers.length; i++) {
          const player = updatedPlayers[i];
          if (!player.isParent && player.betAmount === 0) {
            nextPlayerId = player.id;
            break;
          }
        }
      }
      
      // 全員が賭け金を設定していたら、サイコロを振るフェーズへ移行
      const newPhase = allPlayersBet ? GamePhase.ROLLING : prevState.phase;
      
      // フェーズが変わる場合は、子プレイヤーのうち最初のプレイヤーに設定
      const firstChildId = updatedPlayers.find(player => !player.isParent)?.id || '';
      const newCurrentPlayerId = newPhase === GamePhase.ROLLING ? firstChildId : nextPlayerId;
      
      return {
        ...prevState,
        players: updatedPlayers,
        phase: newPhase,
        currentPlayerId: newCurrentPlayerId
      };
    });
  }, []);
  
  // サイコロを振る関数
  const rollDice = useCallback(() => {
    setGameState(prevState => {
      // 現在のプレイヤーを取得
      const currentPlayerIndex = prevState.players.findIndex(
        player => player.id === prevState.currentPlayerId
      );
      
      if (currentPlayerIndex === -1) return prevState;
      
      const currentPlayer = prevState.players[currentPlayerIndex];
      
      // 振った回数を超えていたら何もしない
      if (currentPlayer.rollCount >= 3 || currentPlayer.rollConfirmed) {
        return prevState;
      }
      
      // 初回の場合は全てのサイコロを振る
      // 2回目以降は保持状態を考慮する
      let newDiceRoll: DiceRoll;
      
      if (currentPlayer.rollCount === 0 || !currentPlayer.diceRoll) {
        // 初回は全て振る
        newDiceRoll = rollThreeDice();
      } else {
        // 2回目以降は保持状態を考慮
        const previousRoll = currentPlayer.diceRoll;
        const diceHold = currentPlayer.diceHold;
        
        newDiceRoll = [
          diceHold[0] ? previousRoll[0] : rollSingleDice(),
          diceHold[1] ? previousRoll[1] : rollSingleDice(),
          diceHold[2] ? previousRoll[2] : rollSingleDice()
        ] as DiceRoll;
      }
      
      const yaku = determineYaku(newDiceRoll);
      const newRollCount = currentPlayer.rollCount + 1;
      const isRollConfirmed = newRollCount >= 3;
      
      // プレイヤーの情報を更新
      const updatedPlayers = [...prevState.players];
      updatedPlayers[currentPlayerIndex] = {
        ...updatedPlayers[currentPlayerIndex],
        diceRoll: newDiceRoll,
        yaku,
        rollCount: newRollCount,
        // 3回目は自動確定
        rollConfirmed: isRollConfirmed
      };
      
      // 親プレイヤーの役が確定した場合、結果フェーズへ移行
      if (isRollConfirmed && currentPlayer.isParent) {
        return {
          ...prevState,
          players: updatedPlayers,
          phase: GamePhase.RESULT
        };
      }
      
      // 確定している場合は次のプレイヤーへ
      if (isRollConfirmed) {
        // 次のプレイヤーを決定
        const nextPlayerId = getNextPlayerId(updatedPlayers, currentPlayer.id);
        
        // 次のプレイヤーがいない場合は結果フェーズへ
        if (!nextPlayerId) {
          return {
            ...prevState,
            players: updatedPlayers,
            phase: GamePhase.RESULT
          };
        }
        
        return {
          ...prevState,
          players: updatedPlayers,
          currentPlayerId: nextPlayerId
        };
      }
      
      // まだ確定していない場合は同じプレイヤーのまま
      return {
        ...prevState,
        players: updatedPlayers
      };
    });
  }, []);
  
  // サイコロの保持状態を更新する関数
  const toggleDiceHold = useCallback((diceIndex: number) => {
    setGameState(prevState => {
      // 現在のプレイヤーを取得
      const currentPlayerIndex = prevState.players.findIndex(
        player => player.id === prevState.currentPlayerId
      );
      
      if (currentPlayerIndex === -1) return prevState;
      
      const currentPlayer = prevState.players[currentPlayerIndex];
      
      // 役が確定している場合は何もしない
      if (currentPlayer.rollConfirmed) return prevState;
      
      // まだサイコロを振っていない場合は何もしない
      if (!currentPlayer.diceRoll || currentPlayer.rollCount === 0) return prevState;
      
      // 保持状態を更新
      const newDiceHold = [...currentPlayer.diceHold] as DiceHold;
      newDiceHold[diceIndex] = !newDiceHold[diceIndex];
      
      // プレイヤーの情報を更新
      const updatedPlayers = [...prevState.players];
      updatedPlayers[currentPlayerIndex] = {
        ...updatedPlayers[currentPlayerIndex],
        diceHold: newDiceHold
      };
      
      return {
        ...prevState,
        players: updatedPlayers
      };
    });
  }, []);
  
  // 役を確定する関数
  const confirmRoll = useCallback(() => {
    setGameState(prevState => {
      // 現在のプレイヤーを取得
      const currentPlayerIndex = prevState.players.findIndex(
        player => player.id === prevState.currentPlayerId
      );
      
      if (currentPlayerIndex === -1) return prevState;
      
      const currentPlayer = prevState.players[currentPlayerIndex];
      
      // まだサイコロを振っていない場合は何もしない
      if (!currentPlayer.diceRoll || currentPlayer.rollCount === 0) return prevState;
      
      // 既に確定している場合は何もしない
      if (currentPlayer.rollConfirmed) return prevState;
      
      // プレイヤーの情報を更新
      const updatedPlayers = [...prevState.players];
      updatedPlayers[currentPlayerIndex] = {
        ...updatedPlayers[currentPlayerIndex],
        rollConfirmed: true
      };
      
      // 親プレイヤーの役が確定した場合、結果フェーズへ移行
      if (currentPlayer.isParent) {
        return {
          ...prevState,
          players: updatedPlayers,
          phase: GamePhase.RESULT
        };
      }
      
      // 次のプレイヤーを決定
      const nextPlayerId = getNextPlayerId(updatedPlayers, currentPlayer.id);
      
      // 次のプレイヤーがいない場合は結果フェーズへ
      if (!nextPlayerId) {
        return {
          ...prevState,
          players: updatedPlayers,
          phase: GamePhase.RESULT
        };
      }
      
      return {
        ...prevState,
        players: updatedPlayers,
        currentPlayerId: nextPlayerId
      };
    });
  }, []);
  
  // 次のプレイヤーIDを取得する関数
  const getNextPlayerId = (players: Player[], currentPlayerId: string): string | null => {
    const currentPlayerIndex = players.findIndex(player => player.id === currentPlayerId);
    if (currentPlayerIndex === -1) return null;
    
    const currentPlayer = players[currentPlayerIndex];
    
    // 現在のプレイヤーが親でない場合
    if (!currentPlayer.isParent) {
      // 次の子プレイヤーを探す
      for (let i = currentPlayerIndex + 1; i < players.length; i++) {
        const player = players[i];
        if (!player.isParent && !player.rollConfirmed) {
          return player.id;
        }
      }
      
      // 子プレイヤーがいない場合、親プレイヤーに移る
      const parentPlayer = players.find(player => player.isParent);
      if (parentPlayer && !parentPlayer.rollConfirmed) {
        return parentPlayer.id;
      }
    }
    
    // 現在のプレイヤーが親の場合、または全プレイヤーが振り終わった場合
    return null;
  };
  
  // 全てのサイコロを再選択するためにリセットする関数
  const resetDiceHold = useCallback(() => {
    setGameState(prevState => {
      // 現在のプレイヤーを取得
      const currentPlayerIndex = prevState.players.findIndex(
        player => player.id === prevState.currentPlayerId
      );
      
      if (currentPlayerIndex === -1) return prevState;
      
      // プレイヤーの情報を更新
      const updatedPlayers = [...prevState.players];
      updatedPlayers[currentPlayerIndex] = {
        ...updatedPlayers[currentPlayerIndex],
        diceHold: [false, false, false]
      };
      
      return {
        ...prevState,
        players: updatedPlayers
      };
    });
  }, []);
  
  // 結果を計算して次のラウンドを準備する関数
  const calculateResults = useCallback(() => {
    setGameState(prevState => {
      const parentPlayer = prevState.players.find(player => player.isParent);
      if (!parentPlayer || !parentPlayer.yaku) return prevState;
      
      // 最初にupdatedPlayersを正しく初期化
      let updatedPlayers = [...prevState.players];
      
      // 各プレイヤーの勝敗を判定して配当を計算
      updatedPlayers = updatedPlayers.map(player => {
        // 親の場合はそのまま
        if (player.isParent) return player;
        
        // 子の場合、勝敗判定と配当計算
        if (player.yaku) {
          const parentWins = determineWinner(parentPlayer.yaku!, player.yaku);
          
          if (parentWins) {
            // 親の勝ち：親がチップを獲得
            const parentIndex = prevState.players.findIndex(p => p.isParent);
            if (parentIndex !== -1) {
              updatedPlayers[parentIndex] = {
                ...updatedPlayers[parentIndex],
                chips: updatedPlayers[parentIndex].chips + player.betAmount
              };
            }
            return player;
          } else {
            // 子の勝ち：子が配当を獲得
            const payout = calculatePayout(player.betAmount, player.yaku);
            return {
              ...player,
              chips: player.chips + player.betAmount + payout
            };
          }
        }
        
        return player;
      });
      
      // 親を続投するかどうかを判定
      let shouldKeepParent = false;
      
      // 親がピンゾロを出した場合は続投
      if (parentPlayer.yaku && parentPlayer.yaku.type === YakuType.PINZORO) {
        shouldKeepParent = true;
      } else {
        // 全ての子に勝ったかどうかを確認
        const allChildPlayers = prevState.players.filter(player => !player.isParent);
        const wonAgainstAllChildren = allChildPlayers.every(player => {
          if (!player.yaku) return true; // 役がない場合は勝ちとみなす
          return determineWinner(parentPlayer.yaku!, player.yaku);
        });
        
        shouldKeepParent = wonAgainstAllChildren;
      }
      
      // 次のラウンドの準備
      if (shouldKeepParent) {
        // 親が続投する場合
        return {
          ...prevState,
          players: updatedPlayers.map(player => ({
            ...player,
            betAmount: 0,
            diceRoll: null,
            yaku: null,
            rollCount: 0,
            diceHold: [false, false, false],
            rollConfirmed: false
          })),
          currentPlayerId: updatedPlayers.find(player => !player.isParent)?.id || prevState.parentId,
          phase: GamePhase.BETTING,
          round: prevState.round + 1
        };
      } else {
        // 親を交代する場合
        const firstChildIndex = updatedPlayers.findIndex(player => !player.isParent);
        if (firstChildIndex !== -1) {
          // 古い親を子にする
          const oldParentIndex = updatedPlayers.findIndex(player => player.isParent);
          if (oldParentIndex !== -1) {
            updatedPlayers[oldParentIndex] = {
              ...updatedPlayers[oldParentIndex],
              isParent: false,
              name: `プレイヤー${oldParentIndex}`
            };
          }
          
          // 新しい親を設定
          updatedPlayers[firstChildIndex] = {
            ...updatedPlayers[firstChildIndex],
            isParent: true,
            name: '親'
          };
          
          // 親IDを更新
          const newParentId = updatedPlayers[firstChildIndex].id;
          
          // 次のラウンド準備
          return {
            ...prevState,
            players: updatedPlayers.map(player => ({
              ...player,
              betAmount: 0,
              diceRoll: null,
              yaku: null,
              rollCount: 0,
              diceHold: [false, false, false],
              rollConfirmed: false
            })),
            currentPlayerId: updatedPlayers.find(player => !player.isParent)?.id || newParentId,
            parentId: newParentId,
            phase: GamePhase.BETTING,
            round: prevState.round + 1
          };
        }
      }
      
      // 何も変更がない場合
      return prevState;
    });
  }, []);
  
  // ゲームをリセットする関数
  const resetGame = useCallback(() => {
    setGameState(createInitialGameState(numPlayers));
  }, [numPlayers]);
  
  return {
    gameState,
    placeBet,
    rollDice,
    toggleDiceHold,
    confirmRoll,
    resetDiceHold,
    calculateResults,
    resetGame
  };
}; 