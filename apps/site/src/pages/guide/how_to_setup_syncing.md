---
layout: ../../layout/MarkdownLayout.astro
page_metadata:
  title: "Syncing Guide"
  description: "How to sync your Cherit notes privately using Syncthing."
  open_graph:
    title: "Syncing Guide | Cherit"
---

# How to Setup Syncing

Cherit is designed to be "Local First". This means your notes are stored as plain files on your device, not on our servers. To sync them between devices, you can use any file syncing solution you like (Nextcloud, Dropbox, Google Drive, etc.).

However, for the best privacy and performance, we recommend **Syncthing**. It's open-source, free, and syncs directly between your devices without storing data in the cloud.

## Step 1: Install Syncthing

Download and install Syncthing on all the devices you want to sync.

- **Desktop (Windows/Mac/Linux):** [Download from syncthing.net](https://syncthing.net/downloads/)
- **Android:** Install "Syncthing" from the Play Store or F-Droid.
- **iOS:** Use "Möbius Sync" (Syncthing client for iOS).

## Step 2: Locate Your Notes

Open Cherit and find your data directory. By default, Cherit stores notes in:

- **Windows:** `Documents/Cherit`
- **Mac/Linux:** `~/Documents/Cherit`
- **Mobile:** You can choose the folder on first launch or in settings.

## Step 3: Add Folder to Syncthing

1. Open the Syncthing dashboard (usually http://127.0.0.1:8384 on desktop).
2. Click "Add Folder".
3. Give it a label like "Cherit Notes".
4. In "Folder Path", enter the path to your Cherit data directory from Step 2.
5. Save.

## Step 4: Connect Your Devices

1. In Syncthing, click "Add Remote Device".
2. Enter the Device ID of your other device (found in "Actions > Show ID").
3. Accept the connection on the other device.

## Step 5: Share the Folder

1. Edit the "Cherit Notes" folder configuration in Syncthing.
2. Go to the "Sharing" tab.
3. Check the device you just connected.
4. Save.
5. On the other device, a prompt will appear to accept the folder. Accept it and point it to the local folder where you want your notes (or where Cherit is already looking).

**That's it!** Any change you make in Cherit will be instantly synced to your other devices as long as they are online.
