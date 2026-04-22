import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { writeFile } from '@tauri-apps/plugin-fs';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import type { GenericPath } from '@/lib/types/';
import { current_platform } from '@/lib/states/session';
import { join_path } from '@/lib/operations/file_tree';

export async function pdf_rendered(file_name: string, location: GenericPath) {
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
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: bg,
      useCORS: true,
      logging: true,
    });
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

    let path: string | URL;

    if (current_platform === 'android') {
      const uri = await AndroidFs.createNewFile(
        {
          uri: location.path,
          documentTopTreeUri: location.document_top_tree_uri,
        },
        file_name + '.pdf',
        'application/pdf'
      );
      path = await AndroidFs.getFsPath(uri);
    } else {
      path = `${join_path(location.path, file_name)}.pdf`;
    }

    console.log('Saving PDF to:', path);
    await writeFile(path, new Uint8Array(doc.output('arraybuffer')));
  } finally {
    document.body.removeChild(clone);
  }
}
