
'use server';

import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

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

export async function getAllNotebooks() {
  if (!fs.existsSync(NOTEBOOKS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(NOTEBOOKS_DIR).filter(f => f.endsWith('.ipynb'));
  
  const notebooks = files.map(filename => {
    const slug = filename.replace('.ipynb', '');
    const filePath = path.join(NOTEBOOKS_DIR, filename);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // First cell is metadata YAML
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
      const cleanYaml = source.replace(/---/g, '').trim();
      try {
        const parsed = yaml.parse(cleanYaml);
        metadata = { ...metadata, ...parsed };
      } catch (e) {
        console.error(`Error parsing YAML in ${filename}:`, e);
      }
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
      const cleanYaml = source.replace(/---/g, '').trim();
      metadata = { ...metadata, ...yaml.parse(cleanYaml) };
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
