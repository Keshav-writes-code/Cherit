<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';
	import { toast } from 'svelte-sonner';

	let is_sync_enabled = $state(false);
	let pairing_pin = $state<string | null>(null);
	let discovered_peers = $state<Array<{ id: string; name: string; is_paired: boolean }>>([]);
	let input_pin = $state('');

	import { workspace_root_path } from '@/lib/states/global/index.svelte';

	async function toggle_sync() {
		try {
			if (!is_sync_enabled) {
				const workspace_root = workspace_root_path.data?.path;
				if (!workspace_root) {
					toast.error("Please open a workspace folder first.");
					return;
				}

				await invoke('start_sync_service', { workspaceRoot: workspace_root });
				is_sync_enabled = true;
				refresh_peers();
				toast.success('Sync service started');
			} else {
				await invoke('stop_sync_service');
				is_sync_enabled = false;
				pairing_pin = null;
				toast.info('Sync service stopped');
			}
		} catch (e) {
			toast.error(`Failed to toggle sync: ${e}`);
		}
	}

	async function get_pin() {
		try {
			pairing_pin = await invoke<string>('generate_pairing_pin');
		} catch (e) {
			toast.error(`Failed to generate PIN: ${e}`);
		}
	}

	let poll_timer: any = null;

	async function refresh_peers() {
		if (!is_sync_enabled) return;
		try {
			discovered_peers = await invoke('get_discovered_peers');
		} catch (e) {
			console.error('Failed to get peers:', e);
		}
		if (poll_timer) clearTimeout(poll_timer);
		poll_timer = setTimeout(refresh_peers, 1000); // Poll every 1s for snappy UI
	}

	async function pair_with_peer(peer_id: string) {
		if (!input_pin) {
			toast.error('Please enter a PIN');
			return;
		}
		try {
			const res: any = await invoke('pair_with_peer', { peerId: peer_id, pin: input_pin });
			if (res.success) {
				toast.success(res.message);
				input_pin = '';
				await refresh_peers();
			} else {
				toast.error(res.message);
			}
		} catch (e) {
			toast.error(`Failed to pair: ${e}`);
		}
	}
</script>

<div class="flex flex-col gap-4 p-4">
	<h2 class="text-xl font-bold">Local Network Sync</h2>

	<div class="flex items-center justify-between bg-base-200 p-4 rounded-lg">
		<div>
			<h3 class="font-semibold">Enable Sync</h3>
			<p class="text-sm opacity-70">Sync notes with devices on the same Wi-Fi network</p>
		</div>
		<input type="checkbox" class="toggle toggle-primary" bind:checked={is_sync_enabled} onclick={(e) => {
			e.preventDefault();
			toggle_sync();
		}} />
	</div>

	{#if is_sync_enabled}
		<div class="bg-base-200 p-4 rounded-lg flex flex-col gap-2">
			<h3 class="font-semibold">Pair a New Device</h3>
			<p class="text-sm opacity-70">Generate a PIN to let another device connect to this one.</p>
			{#if pairing_pin}
				<div class="text-3xl font-mono tracking-widest text-center py-4 bg-base-300 rounded">
					{pairing_pin}
				</div>
			{:else}
				<button class="btn btn-outline" onclick={get_pin}>Generate Pairing PIN</button>
			{/if}
		</div>

		<div class="flex flex-col gap-2">
			<h3 class="font-semibold">Discovered Devices</h3>
			{#if discovered_peers.length === 0}
				<p class="text-sm opacity-70 italic">Scanning network for devices...</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each discovered_peers as peer}
						<li class="flex flex-col gap-2 bg-base-200 p-3 rounded-lg">
							<div class="flex items-center justify-between w-full">
								<span class="font-medium">{peer.name}</span>
								{#if peer.is_paired}
									<div class="flex items-center gap-2">
										<span class="badge badge-success">Paired</span>
										<button class="btn btn-xs btn-ghost text-error" onclick={async () => {
											await invoke('remove_peer', { peerId: peer.id });
											refresh_peers();
										}}>Delete</button>
									</div>
								{:else}
									<div class="flex gap-2">
										<input
											type="text"
											placeholder="PIN"
											class="input input-bordered input-sm w-24"
											bind:value={input_pin}
											maxlength="6"
										/>
										<button class="btn btn-sm btn-primary" onclick={() => pair_with_peer(peer.id)}>
											Connect
										</button>
									</div>
								{/if}
							</div>
							<div class="flex items-center gap-2 mt-1">
								<input
									type="text"
									placeholder="Rename device..."
									class="input input-bordered input-xs flex-1 max-w-40 opacity-50 hover:opacity-100 focus:opacity-100 transition-opacity"
									onchange={async (e) => {
										const newName = e.currentTarget.value;
										if (newName) {
											await invoke('rename_peer', { peerId: peer.id, newName });
											refresh_peers();
										}
									}}
								/>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>
