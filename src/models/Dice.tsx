import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { DiceValue } from '../types/game';

interface DiceProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  value: DiceValue;
  rolling?: boolean;
  hold?: boolean;
  onRollComplete?: () => void;
  onToggleHold?: () => void;
  selectable?: boolean;
  diceIndex?: number;
}

// サイコロの目の位置情報（1〜6の目に対応する回転角度）
const diceRotations: Record<DiceValue, [number, number, number]> = {
  1: [0, 0, 0],           // 1の目が上
  2: [0, Math.PI / 2, 0], // 2の目が上
  3: [Math.PI / 2, 0, 0], // 3の目が上
  4: [-Math.PI / 2, 0, 0],// 4の目が上
  5: [0, -Math.PI / 2, 0],// 5の目が上
  6: [Math.PI, 0, 0]      // 6の目が上
};

const Dice: React.FC<DiceProps> = ({ 
  position, 
  rotation = [0, 0, 0], 
  value, 
  rolling = false,
  hold = false,
  onRollComplete,
  onToggleHold,
  selectable = false,
  diceIndex
}) => {
  const meshRef = useRef<Mesh>(null);
  const targetRotation = useRef<[number, number, number]>(diceRotations[value]);
  const rollSpeed = useRef<Vector3>(new Vector3(
    Math.random() * 0.2 - 0.1,
    Math.random() * 0.2 - 0.1,
    Math.random() * 0.2 - 0.1
  ));
  
  const rollCompleted = useRef<boolean>(false);
  
  // サイコロがクリックされたときのハンドラ
  const handleClick = () => {
    if (selectable && onToggleHold && diceIndex !== undefined) {
      onToggleHold();
    }
  };
  
  // アニメーションの更新
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    if (rolling && !hold) {
      // サイコロを回転させる
      meshRef.current.rotation.x += rollSpeed.current.x;
      meshRef.current.rotation.y += rollSpeed.current.y;
      meshRef.current.rotation.z += rollSpeed.current.z;
      
      // 回転速度を徐々に減衰させる
      rollSpeed.current.multiplyScalar(0.95);
      
      // 回転が十分に遅くなったら、目的の値に向けて回転
      if (rollSpeed.current.length() < 0.01 && !rollCompleted.current) {
        meshRef.current.rotation.set(
          targetRotation.current[0],
          targetRotation.current[1],
          targetRotation.current[2]
        );
        rollCompleted.current = true;
        
        if (onRollComplete) {
          onRollComplete();
        }
      }
    } else {
      // 静止状態の時は目的の値の向きにする
      meshRef.current.rotation.set(
        targetRotation.current[0],
        targetRotation.current[1],
        targetRotation.current[2]
      );
      rollCompleted.current = false;
    }
  });
  
  // 値が変わったら対応する回転角度をセットする
  React.useEffect(() => {
    targetRotation.current = diceRotations[value];
    rollCompleted.current = false;
    
    // 新しく振る時は回転速度をリセット
    if (rolling && !hold) {
      rollSpeed.current = new Vector3(
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 - 0.1,
        Math.random() * 0.2 - 0.1
      );
    }
  }, [value, rolling, hold]);
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      userData={{ selectable }}
    >
      {/* サイコロの本体 */}
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={hold ? "#ffcc00" : "#ffffff"} 
        emissive={hold ? "#ff8800" : "#000000"}
        emissiveIntensity={hold ? 0.5 : 0}
      />
      
      {/* サイコロの目（1〜6）*/}
      {/* 1の目 (中央) */}
      <Dot position={[0, 0, 0.5]} />
      
      {/* 2の目 (左上, 右下) */}
      <Dot position={[-0.3, 0.3, -0.5]} />
      <Dot position={[0.3, -0.3, -0.5]} />
      
      {/* 3の目 (左上, 中央, 右下) */}
      <Dot position={[-0.3, 0.3, 0.5]} />
      <Dot position={[0, 0, -0.5]} />
      <Dot position={[0.3, -0.3, 0.5]} />
      
      {/* 4の目 (四隅) */}
      <Dot position={[-0.3, 0.3, -0.5]} />
      <Dot position={[0.3, 0.3, -0.5]} />
      <Dot position={[-0.3, -0.3, -0.5]} />
      <Dot position={[0.3, -0.3, -0.5]} />
      
      {/* 5の目 (四隅と中央) */}
      <Dot position={[-0.3, 0.3, 0.5]} />
      <Dot position={[0.3, 0.3, 0.5]} />
      <Dot position={[0, 0, 0.5]} />
      <Dot position={[-0.3, -0.3, 0.5]} />
      <Dot position={[0.3, -0.3, 0.5]} />
      
      {/* 6の目 (左側3つ, 右側3つ) */}
      <Dot position={[-0.3, 0.3, -0.5]} />
      <Dot position={[-0.3, 0, -0.5]} />
      <Dot position={[-0.3, -0.3, -0.5]} />
      <Dot position={[0.3, 0.3, -0.5]} />
      <Dot position={[0.3, 0, -0.5]} />
      <Dot position={[0.3, -0.3, -0.5]} />
    </mesh>
  );
};

// サイコロの目を表す点のコンポーネント
interface DotProps {
  position: [number, number, number];
}

const Dot: React.FC<DotProps> = ({ position }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="#000000" />
    </mesh>
  );
};

export default Dice; 