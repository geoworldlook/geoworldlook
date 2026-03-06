
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ChevronRight } from 'lucide-react';
import { getNotebookBySlug, getAllNotebooks } from '@/lib/notebooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const notebooks = await getAllNotebooks();
  return notebooks.map((nb) => ({
    slug: nb.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const notebook = await getNotebookBySlug(slug);
  
  if (!notebook) return { title: 'Not Found' };
  
  return {
    title: `${notebook.metadata.title} | GeoWorldLook`,
    description: notebook.metadata.summary
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const notebook = await getNotebookBySlug(slug);

  if (!notebook) {
    notFound();
  }

  const { metadata, cells } = notebook;

  return (
    <article className="max-w-4xl mx-auto px-4 py-24">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-12">
        <Link href="/blog" className="text-emerald-400 hover:underline transition-all">Blog</Link>
        <ChevronRight size={14} />
        <span className="truncate">{metadata.title}</span>
      </div>

      <Link href="/blog" className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mb-8 hover:gap-3 transition-all">
        <ArrowLeft size={16} />
        Back to Blog
      </Link>

      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {metadata.title}
        </h1>
        <div className="flex items-center gap-6 text-xs text-gray-500 font-mono uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <Calendar size={14} className="text-emerald-400" /> 
            {new Date(metadata.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={14} className="text-emerald-400" /> 
            {metadata.readTime}
          </span>
        </div>
      </header>

      <div className="space-y-8">
        {cells.map((cell: any, idx: number) => {
          const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

          if (cell.cell_type === 'markdown') {
            return (
              <div key={idx} className="prose prose-invert prose-emerald max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {source}
                </ReactMarkdown>
              </div>
            );
          }

          if (cell.cell_type === 'code') {
            return (
              <div key={idx} className="space-y-4">
                <div className="relative group">
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-gray-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    python
                  </div>
                  <pre className="bg-[#0d0d0d] border border-white/5 rounded-xl p-6 overflow-x-auto">
                    <code className="language-python text-sm font-mono leading-relaxed">
                      {source}
                    </code>
                  </pre>
                </div>

                {cell.outputs && cell.outputs.length > 0 && (
                  <div className="space-y-3">
                    {cell.outputs.map((output: any, oIdx: number) => {
                      // Najpierw sprawdzamy czy istnieje obraz
                      if (output.data && output.data['image/png']) {
                        return (
                          <div key={oIdx} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex justify-center">
                            <img 
                              src={`data:image/png;base64,${output.data['image/png']}`} 
                              alt="Notebook visualization" 
                              className="max-w-full h-auto rounded-lg shadow-2xl"
                            />
                          </div>
                        );
                      }
                      // Jeśli nie ma obrazu, renderujemy tekst
                      if (output.output_type === 'stream' || (output.data && output.data['text/plain'])) {
                        const text = output.text ? 
                          (Array.isArray(output.text) ? output.text.join('') : output.text) : 
                          (Array.isArray(output.data['text/plain']) ? output.data['text/plain'].join('') : output.data['text/plain']);
                        
                        return (
                          <pre key={oIdx} className="bg-black/40 border-l-2 border-emerald-500/30 p-4 rounded-r-lg text-xs text-gray-400 overflow-x-auto font-mono">
                            {text}
                          </pre>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
}
