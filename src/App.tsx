import { useState } from 'react';
import { GAMES, gameById } from './games';
import { Gallery } from './components/Gallery';
import { GameShell } from './components/GameShell';

export default function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const def = gameId ? gameById(gameId) : undefined;

  if (!def) {
    return <Gallery games={GAMES} onSelect={setGameId} />;
  }

  // Entering a game always remounts GameShell (the gallery renders in between),
  // so each visit starts a fresh peer session.
  return <GameShell def={def} onExit={() => setGameId(null)} />;
}
