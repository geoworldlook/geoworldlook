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
  const notebooks = getAllNotebooks();
  return notebooks.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const notebook = getNotebookBySlug(slug);
  
  if (!notebook) return { title: 'Post Not Found' };

  return {
    title: `${notebook.metadata.title} | GeoWorldLook`,
    description: notebook.metadata.summary
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const notebook = getNotebookBySlug(slug);

  if (!notebook) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-24">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-12">
        <Link href="/blog" className="text-emerald-400 hover:underline transition-all">Blog</Link>
        <ChevronRight size={14} />
        <span className="truncate">{notebook.metadata.title}</span>
      </div>

      <Link href="/blog" className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mb-8 hover:gap-3 transition-all">
        <ArrowLeft size={16} />
        Back to Index
      </Link>

      <header className="mb-16">
        <div className="flex flex-wrap gap-6 items-center text-xs text-gray-500 mb-6 font-mono uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <Calendar size={14} className="text-emerald-400" /> 
            {new Date(notebook.metadata.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={14} className="text-emerald-400" /> 
            {notebook.metadata.readTime}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {notebook.metadata.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          {notebook.metadata.tags.map(tag => (
            <span key={tag} className="text-[10px] font-mono border border-emerald-400/20 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="space-y-12">
        {notebook.cells.map((cell, idx) => {
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
                {/* Code Input */}
                <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
                  <div className="bg-[#1a1a1a] px-4 py-2 flex items-center justify-between border-b border-white/[0.06]">
                    <span className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      python source
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">[{cell.execution_count || ' '}]</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="language-python">{source}</code>
                  </pre>
                </div>

                {/* Code Outputs */}
                {cell.outputs && cell.outputs.length > 0 && (
                  <div className="space-y-4">
                    {cell.outputs.map((output: any, outIdx: number) => {
                      // Text output (stdout or text/plain)
                      if (output.output_type === 'stream' || (output.data && output.data['text/plain'])) {
                        const text = output.text 
                          ? (Array.isArray(output.text) ? output.text.join('') : output.text)
                          : (Array.isArray(output.data['text/plain']) ? output.data['text/plain'].join('') : output.data['text/plain']);
                        
                        return (
                          <pre key={outIdx} className="bg-black/50 p-4 rounded-lg text-xs text-gray-400 overflow-x-auto font-mono border border-white/[0.03]">
                            {text}
                          </pre>
                        );
                      }

                      // Image output
                      if (output.data && output.data['image/png']) {
                        return (
                          <div key={outIdx} className="bg-white/5 rounded-xl p-4 border border-white/[0.06]">
                            <img 
                              src={`data:image/png;base64,${output.data['image/png']}`} 
                              alt="Notebook visualization" 
                              className="mx-auto rounded-lg shadow-2xl max-w-full h-auto"
                            />
                            <p className="text-center text-[10px] text-gray-600 mt-4 uppercase tracking-widest font-mono">
                              Automated Pipeline Visualization Output
                            </p>
                          </div>
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

      <footer className="mt-24 pt-12 border-t border-white/[0.06]">
        <div className="bg-[#111] rounded-2xl p-8 text-center space-y-4 border border-emerald-400/10">
          <h3 className="text-white font-bold text-xl">Enjoyed this analysis?</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            I regularly export technical notebooks from my remote sensing research. 
            Follow me for more deep dives into geospatial data engineering.
          </p>
          <div className="pt-4 flex justify-center gap-4">
             <Link href="/contact" className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2 rounded-lg font-bold transition-all text-sm">
               Discuss Project
             </Link>
             <Link href="/blog" className="border border-white/10 hover:border-white/20 text-white px-6 py-2 rounded-lg font-bold transition-all text-sm">
               More Articles
             </Link>
          </div>
        </div>
      </footer>
    </article>
  );
}
