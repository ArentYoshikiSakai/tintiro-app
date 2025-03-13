import React, { useState } from 'react';
import { Player, GamePhase } from '../types/game';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
  onPlaceBet?: (amount: number) => void;
  onRollDice?: () => void;
  phase: GamePhase;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ 
  player, 
  isCurrentPlayer,
  onPlaceBet,
  onRollDice,
  phase 
}) => {
  const [betAmount, setBetAmount] = useState<number>(50);
  
  // 賭け金の変更ハンドラ
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(player.chips, parseInt(e.target.value) || 0));
    setBetAmount(value);
  };
  
  // 賭け金をセットするハンドラ
  const handlePlaceBet = () => {
    if (onPlaceBet) {
      onPlaceBet(betAmount);
    }
  };
  
  // サイコロを振るハンドラ
  const handleRollDice = () => {
    if (onRollDice) {
      onRollDice();
    }
  };
  
  // プレイヤーの役情報を表示
  const renderYakuInfo = () => {
    if (!player.yaku) return null;
    
    return (
      <div className="yaku-info">
        <h4>役: {player.yaku.type}</h4>
        <p>{player.yaku.description}</p>
        {player.diceRoll && (
          <p>出目: {player.diceRoll.join(' - ')}</p>
        )}
      </div>
    );
  };
  
  return (
    <div className={`player-info ${isCurrentPlayer ? 'current-player' : ''}`}>
      <div className="player-header">
        <h3>{player.name} {player.isParent ? '(親)' : '(子)'}</h3>
        <p>チップ: {player.chips}</p>
        {player.betAmount > 0 && <p>賭け金: {player.betAmount}</p>}
      </div>
      
      {renderYakuInfo()}
      
      {isCurrentPlayer && phase === GamePhase.BETTING && !player.isParent && (
        <>
          <div className="bet-amount-field">
            <label htmlFor="bet-amount">賭け金額:</label>
            <input
              id="bet-amount"
              type="number"
              min="1"
              max={player.chips}
              value={betAmount}
              onChange={handleBetChange}
              style={{
                padding: '10px',
                fontSize: '16px',
                width: '100%',
                margin: '10px 0',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          <div className="bet-button-container">
            <button 
              onClick={handlePlaceBet}
              style={{
                padding: '12px 20px',
                fontSize: '16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: 'bold'
              }}
            >
              賭ける
            </button>
          </div>
        </>
      )}
      
      {isCurrentPlayer && phase === GamePhase.ROLLING && (
        <div className="roll-controls">
          <button 
            onClick={handleRollDice}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            サイコロを振る
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerInfo; 