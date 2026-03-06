
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
  slug: string;
  metadata: NotebookMetadata;
  cells: any[];
}

const NOTEBOOKS_PATH = path.join(process.cwd(), 'src', 'content', 'notebooks');

export function getAllNotebooks(): (NotebookMetadata & { slug: string })[] {
  if (!fs.existsSync(NOTEBOOKS_PATH)) {
    try {
      fs.mkdirSync(NOTEBOOKS_PATH, { recursive: true });
    } catch (e) {
      console.error(`[Notebooks] Could not create directory: ${NOTEBOOKS_PATH}`);
      return [];
    }
  }

  const files = fs.readdirSync(NOTEBOOKS_PATH).filter(f => f.endsWith('.ipynb'));

  const notebooks = files.map(filename => {
    const slug = filename.replace('.ipynb', '');
    const fullPath = path.join(NOTEBOOKS_PATH, filename);
    
    try {
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const firstCell = content.cells[0];
      if (firstCell && firstCell.cell_type === 'markdown') {
        const source = Array.isArray(firstCell.source) ? firstCell.source.join('') : firstCell.source;
        const yamlMatch = source.match(/```yaml([\s\S]*?)```/) || source.match(/---([\s\S]*?)---/);
        const cleanYaml = yamlMatch ? yamlMatch[1].trim() : source.trim();
        const metadata = yaml.parse(cleanYaml) as NotebookMetadata;
        return {
          slug,
          ...metadata
        };
      }
    } catch (e) {
      console.error(`[Notebooks] Error processing ${filename}:`, e);
      return null;
    }
    return null;
  }).filter((n): n is (NotebookMetadata & { slug: string }) => n !== null);

  return notebooks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getNotebookBySlug(slug: string): NotebookContent | null {
  try {
    const fullPath = path.join(NOTEBOOKS_PATH, `${slug}.ipynb`);
    if (!fs.existsSync(fullPath)) return null;

    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const firstCell = content.cells[0];
    
    if (!firstCell || firstCell.cell_type !== 'markdown') return null;

    const source = Array.isArray(firstCell.source) ? firstCell.source.join('') : firstCell.source;
    const yamlMatch = source.match(/```yaml([\s\S]*?)```/) || source.match(/---([\s\S]*?)---/);
    const cleanYaml = yamlMatch ? yamlMatch[1].trim() : source.trim();
    const metadata = yaml.parse(cleanYaml) as NotebookMetadata;

    return {
      slug,
      metadata,
      cells: content.cells.slice(1)
    };
  } catch (error) {
    console.error(`[Notebooks] Error loading notebook ${slug}:`, error);
    return null;
  }
}
