import { Suspense, useState } from 'react';
import { GAMES, gameById } from './games';
import { PROJECTS, projectById } from './projects';
import { Gallery } from './components/Gallery';
import { ProjectsGallery } from './components/ProjectsGallery';
import { GameShell } from './components/GameShell';

type Screen = 'games' | 'projects';

export default function App() {
  const [screen, setScreen] = useState<Screen>('games');
  const [gameId, setGameId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const def = gameId ? gameById(gameId) : undefined;
  if (def) {
    // Entering a game always remounts GameShell (the gallery renders in between),
    // so each visit starts a fresh peer session.
    return <GameShell def={def} onExit={() => setGameId(null)} />;
  }

  const project = projectId ? projectById(projectId) : undefined;
  if (project) {
    const Project = project.Component;
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-white/10 border-t-[#ccff00] rounded-full animate-spin" />
            <p className="text-gray-400 font-mono text-sm uppercase tracking-widest animate-pulse">
              Loading {project.name}…
            </p>
          </div>
        }
      >
        <Project onExit={() => setProjectId(null)} />
      </Suspense>
    );
  }

  if (screen === 'projects') {
    return (
      <ProjectsGallery
        projects={PROJECTS}
        onSelect={setProjectId}
        onBack={() => setScreen('games')}
      />
    );
  }

  return (
    <Gallery
      games={GAMES}
      onSelect={setGameId}
      onOpenProjects={() => setScreen('projects')}
    />
  );
}
