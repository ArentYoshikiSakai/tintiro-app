import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import Dice from '../models/Dice';
import { DiceRoll, DiceHold } from '../types/game';

interface DiceSceneProps {
  diceRoll: DiceRoll | null;
  diceHold: DiceHold;
  rolling: boolean;
  rollCount: number;
  rollConfirmed: boolean;
  onRollComplete?: () => void;
  onToggleHold?: (diceIndex: number) => void;
}

const DiceScene: React.FC<DiceSceneProps> = ({ 
  diceRoll = [1, 1, 1], 
  diceHold = [false, false, false],
  rolling = false,
  rollCount = 0,
  rollConfirmed = false,
  onRollComplete,
  onToggleHold
}) => {
  const [rollCompleteCount, setRollCompleteCount] = useState(0);
  
  // 各サイコロの回転が完了したときに呼ばれるコールバック
  const handleDiceRollComplete = useCallback(() => {
    setRollCompleteCount(prev => prev + 1);
  }, []);
  
  // すべてのサイコロの回転が完了したらコールバックを呼び出す
  useEffect(() => {
    if (rollCompleteCount === 3 && onRollComplete) {
      onRollComplete();
      setRollCompleteCount(0);
    }
  }, [rollCompleteCount, onRollComplete]);
  
  // サイコロの保持状態の切り替え
  const handleToggleHold = useCallback((diceIndex: number) => {
    if (onToggleHold) {
      onToggleHold(diceIndex);
    }
  }, [onToggleHold]);
  
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Canvas shadows>
        {/* カメラ設定 */}
        <PerspectiveCamera makeDefault position={[0, 3, 6]} />
        <OrbitControls enableZoom={false} />
        
        {/* 光源 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        
        {/* サイコロ */}
        <Dice 
          position={[-2, 0, 0]} 
          value={diceRoll ? diceRoll[0] : 1} 
          hold={diceHold[0]}
          rolling={rolling}
          onRollComplete={handleDiceRollComplete}
          onToggleHold={() => handleToggleHold(0)}
          selectable={rollCount > 0 && !rollConfirmed}
          diceIndex={0}
        />
        <Dice 
          position={[0, 0, 0]} 
          value={diceRoll ? diceRoll[1] : 1} 
          hold={diceHold[1]}
          rolling={rolling}
          onRollComplete={handleDiceRollComplete}
          onToggleHold={() => handleToggleHold(1)}
          selectable={rollCount > 0 && !rollConfirmed}
          diceIndex={1}
        />
        <Dice 
          position={[2, 0, 0]} 
          value={diceRoll ? diceRoll[2] : 1} 
          hold={diceHold[2]}
          rolling={rolling}
          onRollComplete={handleDiceRollComplete}
          onToggleHold={() => handleToggleHold(2)}
          selectable={rollCount > 0 && !rollConfirmed}
          diceIndex={2}
        />
        
        {/* テーブル面 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#22AA22" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default DiceScene; 