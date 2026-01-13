import { type MenuItem } from '@/types';

class MenuState {
  visible = $state(false);
  x = $state(0);
  y = $state(0);
  items = $state<MenuItem[]>([]);
  on_close: (() => void) | null = null;

  // Open the menu
  open(e: MouseEvent, items: MenuItem[], pos?: { x: number; y: number }) {
    e.preventDefault(); // Stop browser context menu
    e.stopPropagation(); // Stop bubbling
    if (pos) {
      this.x = pos.x;
      this.y = pos.y;
    } else {
      this.x = e.clientX;
      this.y = e.clientY;
    }

    this.items = items;
    this.visible = true;
  }

  // Close the menu
  close() {
    this.visible = false;
    if (this.on_close) this.on_close();
  }
  run_on_close(callback: () => void) {
    this.on_close = callback;
  }
}

export const context_menu = new MenuState();
