import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { writeFile } from '@tauri-apps/plugin-fs';
import { current_platform, join_path } from '@/lib/file_system';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import { workspace_root_path } from '@/lib/global_states/index.svelte';

export async function pdf_rendered(file_name: string, location: string) {
  const el = document.getElementById('text_editor');
  if (!el) return;

  const style = window.getComputedStyle(el);
  const bg =
    style.backgroundColor === 'rgba(0, 0, 0, 0)'
      ? window.getComputedStyle(document.body).backgroundColor
      : style.backgroundColor;

  // Clone & Hide
  const clone = el.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: 'fixed',
    top: '-10000px',
    width: `${el.offsetWidth}px`,
    zIndex: '-1',
    background: bg,
  });
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, { scale: 2, backgroundColor: bg });
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();

    doc.addImage(
      canvas.toDataURL('image/jpeg', 1.0),
      'JPEG',
      0,
      0,
      w,
      (canvas.height * w) / canvas.width
    );

    let path: string | URL = `${join_path(location, file_name)}.pdf`;

    if (current_platform === 'android' && workspace_root_path.data) {
      const uri = await AndroidFs.createNewFile(
        {
          uri: workspace_root_path.data.path,
          documentTopTreeUri: workspace_root_path.data.document_top_tree_uri,
        },
        path,
        'application/pdf'
      );
      path = await AndroidFs.getFsPath(uri);
    }

    await writeFile(path, new Uint8Array(doc.output('arraybuffer')));
  } finally {
    document.body.removeChild(clone);
  }
}
