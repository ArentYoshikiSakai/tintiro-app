import React from 'react';
import GameBoard from './components/GameBoard';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>チンチロリン</h1>
        <p>3つのサイコロを使った伝統的な賭けゲーム</p>
      </header>
      <main>
        <GameBoard numPlayers={3} />
      </main>
      <footer className="App-footer">
        <p>© 2023 チンチロリンゲーム - React & Three.js で実装</p>
      </footer>
    </div>
  );
}

export default App;
