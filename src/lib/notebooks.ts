
'use server';

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

/**
 * @fileOverview Jupyter Notebook parser for the Blog pipeline.
 * Extracts metadata from the first cell and prepares content for rendering.
 */

export interface NotebookMetadata {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  readTime: string;
}

export interface NotebookContent {
  metadata: NotebookMetadata;
  cells: any[];
}

const NOTEBOOKS_DIR = path.join(process.cwd(), 'src/content/notebooks');

/**
 * Helper to extract and parse YAML from a markdown string.
 * Handles raw YAML, YAML wrapped in --- delimiters, or YAML in code blocks.
 */
function parseMetadata(source: string): Partial<NotebookMetadata> {
  let content = source.trim();
  
  // Remove markdown code block markers if present (```yaml ... ``` or ``` ...)
  content = content.replace(/^```(?:yaml)?\n/i, '').replace(/\n```$/m, '');
  
  // Remove horizontal rule / frontmatter delimiters (--- ... ---)
  content = content.replace(/^---\n/m, '').replace(/\n---$/m, '');
  
  try {
    return yaml.parse(content) || {};
  } catch (e) {
    console.error('Failed to parse notebook metadata YAML:', e);
    return {};
  }
}

export async function getAllNotebooks() {
  if (!fs.existsSync(NOTEBOOKS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(NOTEBOOKS_DIR).filter(f => f.endsWith('.ipynb'));
  
  const notebooks = files.map(filename => {
    const slug = filename.replace('.ipynb', '');
    const filePath = path.join(NOTEBOOKS_DIR, filename);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // First cell is expected to be a markdown cell containing metadata
    const firstCell = content.cells[0];
    let metadata: NotebookMetadata = {
      title: slug.replace(/-/g, ' '),
      date: new Date().toISOString(),
      summary: '',
      tags: [],
      readTime: '5 min read'
    };

    if (firstCell && firstCell.cell_type === 'markdown') {
      const source = Array.isArray(firstCell.source) ? firstCell.source.join('') : firstCell.source;
      const parsed = parseMetadata(source);
      metadata = { ...metadata, ...parsed };
    }

    return { slug, ...metadata };
  });

  return notebooks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getNotebookBySlug(slug: string): Promise<NotebookContent | null> {
  const filePath = path.join(NOTEBOOKS_DIR, `${slug}.ipynb`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const firstCell = content.cells[0];
    
    let metadata: NotebookMetadata = {
      title: slug.replace(/-/g, ' '),
      date: new Date().toISOString(),
      summary: '',
      tags: [],
      readTime: '5 min read'
    };

    if (firstCell && firstCell.cell_type === 'markdown') {
      const source = Array.isArray(firstCell.source) ? firstCell.source.join('') : firstCell.source;
      const parsed = parseMetadata(source);
      metadata = { ...metadata, ...parsed };
    }

    return {
      metadata,
      cells: content.cells.slice(1) // Skip metadata cell
    };
  } catch (e) {
    console.error(`Error loading notebook ${slug}:`, e);
    return null;
  }
}
