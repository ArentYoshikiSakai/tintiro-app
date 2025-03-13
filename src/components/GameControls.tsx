import React from 'react';
import { GamePhase } from '../types/game';

interface GameControlsProps {
  phase: GamePhase;
  round: number;
  onNextRound?: () => void;
  onResetGame?: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  phase,
  round,
  onNextRound,
  onResetGame
}) => {
  return (
    <div className="game-controls">
      <div className="game-info">
        <h2>チンチロリン</h2>
        <p>ラウンド: {round}</p>
        <p>フェーズ: {phase}</p>
      </div>
      
      <div className="control-buttons">
        {phase === GamePhase.RESULT && (
          <button className="next-round-button" onClick={onNextRound}>
            次のラウンドへ
          </button>
        )}
        <button className="reset-button" onClick={onResetGame}>
          ゲームをリセット
        </button>
      </div>
      
      <div className="rules-summary">
        <h3>役の説明</h3>
        <ul>
          <li><strong>ピンゾロ (1-1-1)</strong>: 最強の役。配当は賭け金の5倍。</li>
          <li><strong>アラシ (同じ数字が3つ)</strong>: 数字が大きいほど強い。配当は賭け金の3倍。</li>
          <li><strong>シゴロ (4-5-6)</strong>: 配当は賭け金の2倍。</li>
          <li><strong>アンコ (同じ数字が2つ)</strong>: 同じ数字の大きさで強さが決まる。配当は賭け金と同額。</li>
          <li><strong>目なし</strong>: 出た目の合計値で勝敗を決める。配当は賭け金と同額。</li>
          <li><strong>ヒフミ (1-2-3)</strong>: 即負け。</li>
        </ul>
      </div>
    </div>
  );
};

export default GameControls; 