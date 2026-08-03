import { ArrowLeft } from 'lucide-react';
import { ProjectDefinition } from '../projects/types';
import { PikachuIcon } from './PikachuIcon';

interface ProjectsGalleryProps {
  projects: ProjectDefinition[];
  onSelect: (id: string) => void;
  onBack: () => void;
}

export function ProjectsGallery({ projects, onSelect, onBack }: ProjectsGalleryProps) {
  return (
    <div className="min-h-screen bg-[#0F1117] text-[#E2E4E8] font-sans selection:bg-[#262B34] px-4 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#9CA3AF] hover:text-[#F5F6F7] transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to games
        </button>

        <header className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_25px_rgba(247,208,44,0.35)]">
              <PikachuIcon className="w-full h-full" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter uppercase italic text-[#F5F6F7]">
            Frankie&apos;s Projects
          </h1>
          <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-[#9CA3AF] mt-4">
            A lab of awesome things I&apos;m building · pick one
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelect(project.id)}
              className={`group relative overflow-hidden text-left rounded-3xl p-7 min-h-[220px] flex flex-col justify-end shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all border border-white/10 bg-gradient-to-br ${project.gradient}`}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              <div className="absolute top-5 left-5 z-10 flex items-center gap-3">
                <span className="w-12 h-12 flex items-center justify-center text-2xl rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                  {project.emoji}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                  {project.status}
                </span>
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                  {project.name}
                </h2>
                <p className="text-sm text-white/85 mt-2 leading-snug drop-shadow-sm">
                  {project.description}
                </p>
                <span className="inline-block mt-4 text-[10px] font-mono font-bold uppercase tracking-widest text-white group-hover:translate-x-1 transition-transform">
                  Open →
                </span>
              </div>
            </button>
          ))}
        </div>

        <footer className="text-center mt-16 text-[10px] font-mono uppercase tracking-widest text-[#6B7280]">
          More projects landing soon
        </footer>
      </div>
    </div>
  );
}
