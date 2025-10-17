Run the dev Server on Nvidia Driver (linux)

```sh
WEBKIT_DISABLE_DMABUF_RENDERER=1 bun tauri dev
```

for folks having older Nvidia GPU on linux and seeing a Blank screen when opening the app, just do these things

- edit the file at `/usr/share/applications/cherit.desktop`
- next to `Exec :`, replace it with this `Exec: WEBKIT_DISABLE_DMABUF_RENDERER=1 ...`
