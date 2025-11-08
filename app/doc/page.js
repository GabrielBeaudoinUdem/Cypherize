import { docData } from './doc.js';

export default function DocPage({ searchParams }) {
  const sectionId = searchParams.section || docData[0]?.id;
  const section = docData.find(s => s.id === sectionId);

  if (!section) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Not Found</h1>
        <p className="text-zinc-400 mt-2">Please select a section from the left menu.</p>
      </div>
    );
  }

  return (
    <article className="prose prose-invert max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-4">{section.title}</h1>
      
      <div className="my-6 aspect-video w-full rounded-lg overflow-hidden border border-[#2A3239] bg-[#1A2127]">
        {section.mediaType === 'video' ? (
          <video
            src={section.mediaSrc}
            controls
            autoPlay
            muted
            loop
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={section.mediaSrc}
            alt={`Illustration pour ${section.title}`}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <p className="text-zinc-300 leading-relaxed">
        {section.description}
      </p>
    </article>
  );
}