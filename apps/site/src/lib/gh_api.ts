const gh_token: string | undefined = import.meta.env.GH_TOKEN;
export const owner = "keshav-writes-code";
export const repo = "cherit";

export const file = (suffix: string) =>
  `https://github.com/${owner}/${repo}/releases/latest/download/${repo}-${suffix}`;

export async function call_gh_api(path?: string) {
  const headers: Record<string, string> = {
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (gh_token) {
    headers["Authorization"] = `Bearer ${gh_token}`;
  }
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}${path ? path : ""}`,
    { headers },
  );
  return await res.json();
}
