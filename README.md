<p align="center"><img src="https://socialify.git.ci/Keshav-writes-code/Cherit/image?description=1&amp;logo=https%3A%2F%2Fraw.githubusercontent.com%2FKeshav-writes-code%2FCherit%2Fmain%2Fpublic%2Flogo_500.png&amp;name=1&amp;pattern=Plus&amp;theme=Auto" alt="project-image"></p>

## Contribution Guidelines

Run the dev Server on Nvidia Driver (linux)

```sh
WEBKIT_DISABLE_DMABUF_RENDERER=1 bun tauri dev
```

for folks having older Nvidia GPU on linux and seeing a Blank screen when opening the app, just do these things

- edit the file at `/usr/share/applications/cherit.desktop`
- next to `Exec :`, replace it with this `Exec: WEBKIT_DISABLE_DMABUF_RENDERER=1 ...`
