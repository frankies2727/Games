import { Suspense } from 'react';
import { GAMES, gameById } from './games';
import { PROJECTS, projectById } from './projects';
import { Gallery } from './components/Gallery';
import { ProjectsGallery } from './components/ProjectsGallery';
import { GameShell } from './components/GameShell';
import { navigate, useRoute } from './lib/router';

// URL-driven navigation. Each screen has its own path under the site base:
//   /Games/                     → games gallery (home)
//   /Games/play/<gameId>        → a game
//   /Games/projects             → Frankie's projects gallery
//   /Games/projects/<projectId> → a project (VibeCheck, AI Art, …)
export default function App() {
  const route = useRoute();
  const seg = route.split('/').filter(Boolean);

  // /play/<gameId>
  if (seg[0] === 'play' && seg[1]) {
    const def = gameById(seg[1]);
    if (def) {
      // Keyed by id so each game (re)mounts fresh — a new peer session per visit.
      return <GameShell key={seg[1]} def={def} onExit={() => navigate('')} />;
    }
    // Unknown game id → fall through to the games gallery.
  }

  // /projects and /projects/<id>
  if (seg[0] === 'projects') {
    const project = seg[1] ? projectById(seg[1]) : undefined;
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
          <Project key={seg[1]} onExit={() => navigate('projects')} />
        </Suspense>
      );
    }
    // /projects (or an unknown project id) → the projects gallery.
    return (
      <ProjectsGallery
        projects={PROJECTS}
        onSelect={(id) => navigate(`projects/${id}`)}
        onBack={() => navigate('')}
      />
    );
  }

  // Default: the games gallery (home).
  return (
    <Gallery
      games={GAMES}
      onSelect={(id) => navigate(`play/${id}`)}
      onOpenProjects={() => navigate('projects')}
    />
  );
}
