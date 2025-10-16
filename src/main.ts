import { mount } from "svelte";
import App from "./App.svelte";

import "uno.css";
import "daisyui/theme/dark.css";
import "@/fonts.css";

const app = mount(App, {
  target: document.body,
});

export default app;
