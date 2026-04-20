---
title: CI/CD Pipelines
description: How we test, build, and release Cherit automatically.
---

```mermaid
graph LR
    subgraph Triggers ["⚡ Automated Events"]
        DevPR["PR ➔ 'dev'"]
        StgPushPR["Push / PR ➔ 'staging'"]
        MainPushPR["Push / PR ➔ 'main'"]
    end

    subgraph AppWorkflows ["📦 App (Tauri)"]
        Debug["`**app-build-debug**
        *(Manual Trigger Only)*
        - Mode: debug
        - Output: Workflow artifacts`"]

        Artifacts["`**app-build-release-artifacts**
        - Mode: Release
        - Output: Workflow artifacts`"]

        Release["`**app-build-release-publish**
        - Mode: Release
        - Output: GH Release Draft`"]
    end

    subgraph SiteWorkflows ["🌐 Website (Astro)"]
        SiteCheck["`**site-build-check**
        - Purpose: Verify build
        - Output: Temp artifacts`"]

        SiteDeploy["`**site-deploy**
        - Purpose: Push to prod
        - Output: GH Pages`"]
    end

    %% Floating Explanation
    GlobalNote["`**ℹ️ Note:**
    You can run any of these workflows
    manually whenever you need to.
    The arrows show what runs automatically.`"]

    %% Automated Workflow Triggers
    MainPushPR --> Release
    MainPushPR --> SiteDeploy

    StgPushPR --> Artifacts
    StgPushPR --> SiteCheck

    DevPR --> Artifacts
    DevPR --> SiteCheck

    %% Styling Classes
    classDef trigger fill:#f3f4f6,stroke:#4b5563,stroke-width:1px,color:#000
    classDef appNode fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000,text-align:left
    classDef siteNode fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000,text-align:left

    %% Note styled for dark mode (soft slate background, light text)
    classDef noteNode fill:#334155,stroke:#475569,stroke-width:1px,stroke-dasharray: 5 5,color:#f8fafc,text-align:center

    %% Apply Styles
    class DevPR,StgPushPR,MainPushPR trigger
    class Debug,Artifacts,Release appNode
    class SiteCheck,SiteDeploy siteNode
    class GlobalNote noteNode
```

## `app-build-debug`

- when we need debug builds while bugfixing

## `app-build-release-publish`

- when we want to publish a new version of the app

## `app-build-release-artifacts`

- when we just want the build bundles of the app without publishing it

## `site-build-check`

- when we just to build the site for final local testing
- we download the `site-build-output.zip` from the workflow artifacts and extract with:

  ```sh
  unzip site-build-output.zip
  cd site-build-output
  mkdir Cherit
  mv * Cherit
  ```

  then, actually run the server

  ```sh
  bunx serve .
  ```

  then navigate to `http://localhost:3000/Cherit` in browser to run the built site.
