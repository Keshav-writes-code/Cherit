import { mount } from 'svelte';
import App from '@/App.svelte';

import 'uno.css';
import 'daisyui/theme/dark.css';
import '@/styles/global.css';
import '@/styles/fonts.css';

import '@saurl/tauri-plugin-safe-area-insets-css-api';

const app = mount(App, {
  target: document.body,
});

export default app;
