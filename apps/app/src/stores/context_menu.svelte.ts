export type ContextMenuItem = {
  label: string;
  action?: () => void;
  type?: 'default' | 'danger' | 'warning';
  icon_class?: string;
  divider?: boolean; // To render a <hr>
};

class ContextMenuState {
  visible = $state(false);
  x = $state(0);
  y = $state(0);
  items = $state<ContextMenuItem[]>([]);
  on_close: (() => void) | null = null;

  // Open the menu
  open(e: MouseEvent, items: ContextMenuItem[]) {
    e.preventDefault(); // Stop browser context menu
    e.stopPropagation(); // Stop bubbling

    this.x = e.clientX;
    this.y = e.clientY;
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

export const context_menu = new ContextMenuState();
