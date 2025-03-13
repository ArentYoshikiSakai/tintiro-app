import React, { useState, useCallback, useRef, useEffect } from 'react';
import DiceScene from './DiceScene';
import PlayerInfo from './PlayerInfo';
import GameControls from './GameControls';
import { useGameState } from '../hooks/useGameState';
import { GamePhase } from '../types/game';
import '../styles/GameBoard.css';

interface GameBoardProps {
  numPlayers?: number;
}

const GameBoard: React.FC<GameBoardProps> = ({ numPlayers = 2 }) => {
  const { 
    gameState, 
    placeBet, 
    rollDice, 
    toggleDiceHold,
    confirmRoll,
    resetDiceHold,
    calculateResults, 
    resetGame 
  } = useGameState(numPlayers);
  
  const [isRolling, setIsRolling] = useState(false);
  const prevPhaseRef = useRef<GamePhase | null>(null);
  
  // 現在のプレイヤーを取得
  const currentPlayer = gameState.players.find(
    player => player.id === gameState.currentPlayerId
  );
  
  // フェーズが変わったときの処理
  useEffect(() => {
    // 前回のフェーズと現在のフェーズが異なり、現在が結果フェーズの場合
    if (prevPhaseRef.current !== gameState.phase && gameState.phase === GamePhase.RESULT) {
      // 少し待ってから結果を処理（UIの表示のため）
      const timer = setTimeout(() => {
        calculateResults();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    // 現在のフェーズを記録
    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase, calculateResults]);
  
  // 賭け金設定ハンドラ
  const handlePlaceBet = useCallback((amount: number) => {
    if (currentPlayer) {
      placeBet(currentPlayer.id, amount);
    }
  }, [currentPlayer, placeBet]);
  
  // サイコロを振るハンドラ
  const handleRollDice = useCallback(() => {
    setIsRolling(true);
    // サイコロの回転が終わったら実際の結果を設定
    setTimeout(() => {
      rollDice();
    }, 500); // サイコロのアニメーションが始まるまでの遅延
  }, [rollDice]);
  
  // サイコロの回転が完了したときのハンドラ
  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
  }, []);
  
  // サイコロの保持状態を切り替えるハンドラ
  const handleToggleHold = useCallback((diceIndex: number) => {
    toggleDiceHold(diceIndex);
  }, [toggleDiceHold]);
  
  // 役を確定するハンドラ
  const handleConfirmRoll = useCallback(() => {
    confirmRoll();
  }, [confirmRoll]);
  
  // サイコロの保持状態をリセットするハンドラ
  const handleResetDiceHold = useCallback(() => {
    resetDiceHold();
  }, [resetDiceHold]);
  
  // 次のラウンドに進むハンドラ
  const handleNextRound = useCallback(() => {
    calculateResults();
  }, [calculateResults]);
  
  // サイコロ操作のUI表示
  const renderDiceControls = () => {
    if (!currentPlayer || gameState.phase !== 'サイコロを振るフェーズ') return null;
    
    // 最初のロール前
    if (currentPlayer.rollCount === 0) {
      return (
        <div className="dice-controls">
          <button 
            onClick={handleRollDice}
            disabled={isRolling || currentPlayer.rollConfirmed}
            className="roll-button"
          >
            サイコロを振る
          </button>
        </div>
      );
    }
    
    // 2回目、3回目のロール前（役確定前）
    if (!currentPlayer.rollConfirmed && currentPlayer.rollCount < 3) {
      return (
        <div className="dice-controls">
          <div className="dice-controls-info">
            <p>保持するサイコロをクリックしてください（黄色 = 保持）</p>
            <p>残り振り直し回数: {3 - currentPlayer.rollCount}回</p>
          </div>
          <div className="dice-control-buttons">
            <button 
              onClick={handleRollDice}
              disabled={isRolling}
              className="roll-button"
            >
              選択したサイコロを振り直す
            </button>
            <button 
              onClick={handleConfirmRoll}
              className="confirm-button"
            >
              この役で確定する
            </button>
            <button 
              onClick={handleResetDiceHold}
              className="reset-button"
            >
              選択をリセット
            </button>
          </div>
        </div>
      );
    }
    
    // 役確定後（次のプレイヤーを待つ）
    return (
      <div className="dice-controls">
        <p>役が確定しました：{currentPlayer.yaku?.type}</p>
        {currentPlayer.diceRoll && (
          <p>出目: {currentPlayer.diceRoll.join(' - ')}</p>
        )}
      </div>
    );
  };
  
  return (
    <div className="game-board">
      <div className="game-header">
        <GameControls
          phase={gameState.phase}
          round={gameState.round}
          onNextRound={handleNextRound}
          onResetGame={resetGame}
        />
      </div>
      
      <div className="dice-container">
        <DiceScene
          diceRoll={currentPlayer?.diceRoll || null}
          diceHold={currentPlayer?.diceHold || [false, false, false]}
          rolling={isRolling}
          rollCount={currentPlayer?.rollCount || 0}
          rollConfirmed={currentPlayer?.rollConfirmed || false}
          onRollComplete={handleRollComplete}
          onToggleHold={handleToggleHold}
        />
        {renderDiceControls()}
      </div>
      
      <div className="players-container">
        {gameState.players.map(player => (
          <PlayerInfo
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === gameState.currentPlayerId}
            onPlaceBet={handlePlaceBet}
            onRollDice={handleRollDice}
            phase={gameState.phase}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard; 