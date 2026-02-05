import { generateText } from 'ai';
import { model } from './states.svelte';
import { toast } from 'svelte-sonner';

export async function get_summarized_text(text: string) {
  if (!model.data) {
    toast.error('Please Set your Language Model Provider First');
    return;
  }
  const prompt = `
You are an Expet Markdown Writter. You job is to Summarize the text given to you to make it clearer, simpler and summarized in a short sentence.

the markdown text you are given is this:

'${text}'

your job is to summarize this text and output only the markdown summary of the text.
DO NOT ouput a confirmation response like "yeah, no problems, i will do that"
DO NOT output a markdown wrapped inside a code block like \`\`\`# Markdown\`\`\`. only output pure markdown
ONLY output the summarized markdown text in the resaponse and nothing else
`;
  const { text: summarized_text } = await generateText({
    model: model.data,
    prompt,
  });
  return summarized_text;
}
export async function get_rephrased_text(text: string) {
  if (!model.data) {
    toast.error('Please Set your Language Model Provider First');
    return;
  }
  const prompt = `
You are an Expet Markdown Writter. You job is to Rephrase the text given to you to and make it clearer, simpler and sound good.

the markdown text you are given is this:

'${text}'

DO NOT ouput a confirmation response like "yeah, no problems, i will do that"
DO NOT output a markdown wrapped inside a code block like \`\`\`# Markdown\`\`\`. only output pure markdown
ONLY output the summarized markdown text in the resaponse and nothing else
`;
  const { text: rephrased_text } = await generateText({
    model: model.data,
    prompt,
  });
  return rephrased_text;
}
