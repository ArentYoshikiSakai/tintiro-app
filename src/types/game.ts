// ゲームで使用する型定義

// サイコロの目の型（1〜6）
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

// サイコロの出目の組み合わせ
export type DiceRoll = [DiceValue, DiceValue, DiceValue];

// サイコロの保持状態（true = 保持する、false = 振り直す）
export type DiceHold = [boolean, boolean, boolean];

// 役の種類
export enum YakuType {
  PINZORO = 'ピンゾロ',      // 1-1-1
  ARASHI = 'アラシ',        // 同じ数字が3つ
  SHIGORO = 'シゴロ',       // 4-5-6
  ANKO = 'アンコ',          // 同じ数字が2つ
  MENASHI = '目なし',       // その他の組み合わせ
  HIFUMI = 'ヒフミ'         // 1-2-3（負け）
}

// 役の情報
export interface Yaku {
  type: YakuType;
  value: number;          // 役の強さを数値で表現（比較用）
  multiplier: number;     // 配当倍率
  description: string;    // 役の説明
  diceValues: number[];   // サイコロの値（詳細な比較用）
}

// プレイヤーの状態
export interface Player {
  id: string;
  name: string;
  isParent: boolean;      // 親かどうか
  chips: number;          // 持ちチップ
  betAmount: number;      // 賭け金
  diceRoll: DiceRoll | null;  // サイコロの出目
  yaku: Yaku | null;      // 役
  rollCount: number;      // 振った回数（最大3回）
  diceHold: DiceHold;     // サイコロの保持状態
  rollConfirmed: boolean; // 役が確定したかどうか
}

// ゲームの状態
export enum GamePhase {
  BETTING = '賭け金設定フェーズ',
  ROLLING = 'サイコロを振るフェーズ',
  RESULT = '結果表示フェーズ',
  GAME_OVER = 'ゲーム終了'
}

// ゲームの状態
export interface GameState {
  players: Player[];
  currentPlayerId: string;   // 現在のプレイヤーID
  parentId: string;          // 親のプレイヤーID
  phase: GamePhase;          // 現在のゲームフェーズ
  round: number;             // 現在のラウンド
} 