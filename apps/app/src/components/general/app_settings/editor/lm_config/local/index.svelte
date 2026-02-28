<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { LLMStreamListener } from 'tauri-plugin-llm-api';
  const listener = new LLMStreamListener();
  let text = $state<string>();
  listener.setup({
    onData: (id, data, timestamp) => {
      text = new TextDecoder().decode(data);
      console.log(text);
    },
    onError: (msg) => console.error('Error:', msg),
    onEnd: (usage) => {
      if (usage) {
        console.log(`Done. ${usage.total_tokens} tokens used.`);
      }
    },
  });
</script>

<button
  onclick={async () => {
    console.log('CLicked');
    const configJson = await invoke<string>('download_and_load_model', {
      modelRepo: 'Qwen/Qwen3-4B-Instruct-2507',
    });
    console.log('Downlaoded');

    console.log(JSON.parse(configJson));
    await listener.addConfiguration(configJson);
  }}
  class="btn">Download and Load</button
>
<button
  class="btn"
  onclick={async () => {
    console.log('Hello');
    listener.listAvailableModels().then((d) => {
      console.log(d);
    });
    await listener.stream({
      type: 'Prompt',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is Tauri?' },
      ],
      tools: [],
      max_tokens: 200,
      stream: true,
    });
  }}>Test</button
>
<textarea name="" value={text} id=""></textarea>
