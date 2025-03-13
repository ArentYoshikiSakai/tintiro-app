import { DiceRoll, DiceValue, Yaku, YakuType } from '../types/game';

// サイコロをランダムに振る関数
export const rollDice = (): DiceValue => {
  return (Math.floor(Math.random() * 6) + 1) as DiceValue;
};

// 3つのサイコロを振る関数
export const rollThreeDice = (): DiceRoll => {
  return [
    Math.floor(Math.random() * 6 + 1) as DiceValue,
    Math.floor(Math.random() * 6 + 1) as DiceValue,
    Math.floor(Math.random() * 6 + 1) as DiceValue
  ];
};

// サイコロの出目を昇順にソートする関数
export const sortDiceRoll = (diceRoll: DiceRoll): DiceRoll => {
  return [...diceRoll].sort((a, b) => a - b) as DiceRoll;
};

// 出目から役を判定する関数
export const determineYaku = (diceRoll: DiceRoll): Yaku => {
  // 出目を昇順にソート
  const sortedDice = [...diceRoll].sort((a, b) => a - b);
  
  // ピンゾロ (1-1-1)
  if (diceRoll[0] === 1 && diceRoll[1] === 1 && diceRoll[2] === 1) {
    return {
      type: YakuType.PINZORO,
      value: 6,
      multiplier: 5,
      description: '3つとも1の目',
      diceValues: [...diceRoll]
    };
  }
  
  // アラシ (同じ数字が3つ)
  if (diceRoll[0] === diceRoll[1] && diceRoll[1] === diceRoll[2]) {
    return {
      type: YakuType.ARASHI,
      value: 5,
      multiplier: 3,
      description: `${diceRoll[0]}-${diceRoll[1]}-${diceRoll[2]}`,
      diceValues: [...diceRoll]
    };
  }
  
  // シゴロ (4-5-6)
  if (sortedDice[0] === 4 && sortedDice[1] === 5 && sortedDice[2] === 6) {
    return {
      type: YakuType.SHIGORO,
      value: 4,
      multiplier: 2,
      description: '4-5-6',
      diceValues: [...diceRoll]
    };
  }
  
  // ヒフミ (1-2-3)
  if (sortedDice[0] === 1 && sortedDice[1] === 2 && sortedDice[2] === 3) {
    return {
      type: YakuType.HIFUMI,
      value: 0,
      multiplier: 0,
      description: '1-2-3 (即負け)',
      diceValues: [...diceRoll]
    };
  }
  
  // アンコ (同じ数字が2つ)
  if (diceRoll[0] === diceRoll[1] || diceRoll[1] === diceRoll[2] || diceRoll[0] === diceRoll[2]) {
    let pairValue: DiceValue;
    let singleValue: DiceValue;
    
    if (diceRoll[0] === diceRoll[1]) {
      pairValue = diceRoll[0];
      singleValue = diceRoll[2];
    } else if (diceRoll[1] === diceRoll[2]) {
      pairValue = diceRoll[1];
      singleValue = diceRoll[0];
    } else {
      pairValue = diceRoll[0];
      singleValue = diceRoll[1];
    }
    
    return {
      type: YakuType.ANKO,
      value: 3,
      multiplier: 1,
      description: `${pairValue}が2つと${singleValue}`,
      diceValues: [pairValue, singleValue] // ペアの値と単独の値を保存
    };
  }
  
  // 目なし (それ以外)
  const sum = diceRoll[0] + diceRoll[1] + diceRoll[2];
  return {
    type: YakuType.MENASHI,
    value: 1,
    multiplier: 1,
    description: `合計${sum}`,
    diceValues: [...diceRoll]
  };
};

// 勝者を決定する関数（親が勝つかどうかを返す）
export const determineWinner = (parentYaku: Yaku, childYaku: Yaku): boolean => {
  // 役の値で比較（値が大きいほど強い）
  if (parentYaku.value > childYaku.value) {
    return true;  // 親の勝ち
  } else if (parentYaku.value < childYaku.value) {
    return false; // 子の勝ち
  }
  
  // 同じ役の場合、役のタイプによって詳細な比較を行う
  if (parentYaku.type === YakuType.ARASHI && childYaku.type === YakuType.ARASHI) {
    // アラシ同士：数字の大きさで決まる
    const parentValue = parentYaku.diceValues[0];
    const childValue = childYaku.diceValues[0];
    return parentValue >= childValue; // 同じ場合は親の勝ち
  } else if (parentYaku.type === YakuType.ANKO && childYaku.type === YakuType.ANKO) {
    // アンコ同士：ゾロ目の数字の大きさ、同じなら残りの1つの目の大きさ
    const parentPairValue = parentYaku.diceValues[0];
    const childPairValue = childYaku.diceValues[0];
    
    if (parentPairValue !== childPairValue) {
      return parentPairValue > childPairValue;
    }
    
    const parentSingleValue = parentYaku.diceValues[1];
    const childSingleValue = childYaku.diceValues[1];
    return parentSingleValue >= childSingleValue; // 同じ場合は親の勝ち
  } else if (parentYaku.type === YakuType.MENASHI && childYaku.type === YakuType.MENASHI) {
    // 目なし同士：合計値の大きさ
    const parentSum = parentYaku.diceValues.reduce((sum: number, val: number) => sum + val, 0);
    const childSum = childYaku.diceValues.reduce((sum: number, val: number) => sum + val, 0);
    return parentSum >= childSum; // 同じ場合は親の勝ち
  }
  
  // 完全に同じ役の場合や、その他の場合は親の勝ち
  return true;
};

// 配当を計算する関数
export const calculatePayout = (betAmount: number, yaku: Yaku): number => {
  return betAmount * yaku.multiplier;
}; 