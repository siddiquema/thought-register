// onedrive-sync: optional, opt-in cross-device sync via one JSON file in
// the user's own OneDrive app folder. Off by default — nothing here runs
// until the user explicitly signs in. Uses the Files.ReadWrite.AppFolder
// scope, so this app can only ever see the one file it creates, never the
// rest of the user's Drive.
//
// Sign-in and token handling go through Microsoft's own MSAL.js (loaded via
// CDN in index.html) rather than a hand-rolled OAuth/PKCE implementation —
// that's not something worth reinventing.

// Set this to the "Application (client) ID" from your Azure App
// registration (see the project's setup notes). It is not a secret and is
// safe to commit — it only identifies which app is asking to sign in.
const ONEDRIVE_CLIENT_ID = 'PASTE_YOUR_CLIENT_ID_HERE';

const ONEDRIVE_SYNC_FILENAME = 'thought-register-sync.json';
const ONEDRIVE_SCOPES = ['Files.ReadWrite.AppFolder'];
const GRAPH_APPROOT_FILE_URL =
  `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${ONEDRIVE_SYNC_FILENAME}:/content`;

let msalApp = null;
let msalReady = null;

function isOneDriveConfigured() {
  return Boolean(ONEDRIVE_CLIENT_ID) && ONEDRIVE_CLIENT_ID !== 'PASTE_YOUR_CLIENT_ID_HERE';
}

function initMsal() {
  if (msalReady) return msalReady;

  msalApp = new msal.PublicClientApplication({
    auth: {
      clientId: ONEDRIVE_CLIENT_ID,
      // "consumers" matches an Azure app registration scoped to Personal
      // Microsoft accounts only — not the multi-tenant "common" endpoint.
      authority: 'https://login.microsoftonline.com/consumers',
      redirectUri: window.location.origin + window.location.pathname,
    },
    cache: {
      // localStorage (not the default sessionStorage) so the session
      // survives the full-page redirect round-trip to Microsoft's login
      // page and back, and persists across app restarts on mobile.
      cacheLocation: 'localStorage',
    },
  });

  msalReady = msalApp.initialize()
    .then(() => msalApp.handleRedirectPromise())
    .then((response) => {
      if (response && response.account) {
        msalApp.setActiveAccount(response.account);
      } else {
        const accounts = msalApp.getAllAccounts();
        if (accounts.length > 0) msalApp.setActiveAccount(accounts[0]);
      }
      return msalApp;
    });

  return msalReady;
}

function getSignedInAccount() {
  return msalApp ? msalApp.getActiveAccount() : null;
}

async function signInToOneDrive() {
  await initMsal();
  await msalApp.loginRedirect({ scopes: ONEDRIVE_SCOPES });
}

async function signOutOfOneDrive() {
  await initMsal();
  await msalApp.logoutRedirect({ account: getSignedInAccount() });
}

async function getOneDriveAccessToken() {
  await initMsal();
  const account = getSignedInAccount();
  if (!account) return null;

  try {
    const result = await msalApp.acquireTokenSilent({ scopes: ONEDRIVE_SCOPES, account });
    return result.accessToken;
  } catch {
    // Silent renewal failed (expired session, revoked consent, etc.) — fall
    // back to an interactive redirect. The page navigates away here.
    await msalApp.acquireTokenRedirect({ scopes: ONEDRIVE_SCOPES });
    return null;
  }
}

async function downloadSyncFile(token) {
  const response = await fetch(GRAPH_APPROOT_FILE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null; // first sync from this account
  if (!response.ok) throw new Error(`OneDrive download failed (${response.status})`);
  return response.json();
}

async function uploadSyncFile(token, payload) {
  const response = await fetch(GRAPH_APPROOT_FILE_URL, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`OneDrive upload failed (${response.status})`);
}

async function buildSyncPayload() {
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    thoughts: await getThoughts(),
    thoughtVersions: await idbGetAll(STORE_VERSIONS),
    tombstones: await getTombstones(),
  };
}

// Versions merge by (thoughtId, versionNumber), never by the remote's own
// versionId: that id is a local auto-increment counter on the device that
// created it, not a globally unique key, so reusing it here could silently
// overwrite an unrelated version record that happens to share the number.
async function mergeRemoteVersions(remoteVersions) {
  const localByThought = new Map();

  for (const remoteVersion of remoteVersions) {
    if (!localByThought.has(remoteVersion.thoughtId)) {
      localByThought.set(remoteVersion.thoughtId, await getThoughtVersions(remoteVersion.thoughtId));
    }
    const existing = localByThought.get(remoteVersion.thoughtId);
    const alreadyHave = existing.some((v) => v.versionNumber === remoteVersion.versionNumber);
    if (!alreadyHave) {
      const { versionId, ...withoutLocalId } = remoteVersion;
      await idbPut(STORE_VERSIONS, withoutLocalId);
      existing.push(withoutLocalId);
    }
  }
}

// Last-edit-wins per thought, by updatedAt. A remote tombstone deletes the
// local thought unless it was edited locally *after* that deletion; known
// limitation: two devices editing the same thought while both offline
// resolve by timestamp only, with no merge of the actual text.
async function mergeRemoteIntoLocal(remote) {
  for (const tomb of remote.tombstones || []) {
    const local = await getThought(tomb.id);
    if (local) {
      if (new Date(tomb.deletedAt) >= new Date(local.updatedAt)) {
        await deleteThought(tomb.id);
      }
    } else {
      const haveTombstone = await idbGet(STORE_TOMBSTONES, tomb.id);
      if (!haveTombstone) await idbPut(STORE_TOMBSTONES, tomb);
    }
  }

  const tombstonesAfterDeletes = new Map((await getTombstones()).map((t) => [t.id, t.deletedAt]));

  for (const remoteThought of remote.thoughts || []) {
    const tombstoneAt = tombstonesAfterDeletes.get(remoteThought.id);
    if (tombstoneAt && new Date(tombstoneAt) >= new Date(remoteThought.updatedAt)) continue;

    const local = await getThought(remoteThought.id);
    if (!local || new Date(remoteThought.updatedAt) > new Date(local.updatedAt)) {
      await idbPut(STORE_THOUGHTS, remoteThought);
    }
  }

  await mergeRemoteVersions(remote.thoughtVersions || []);
}

async function syncWithOneDrive() {
  const token = await getOneDriveAccessToken();
  if (!token) return { status: 'no-token' };

  const remote = await downloadSyncFile(token);
  if (remote) {
    await mergeRemoteIntoLocal(remote);
  }

  const merged = await buildSyncPayload();
  await uploadSyncFile(token, merged);

  const syncedAt = new Date().toISOString();
  await idbPut(STORE_META, { key: 'oneDriveLastSyncedAt', value: syncedAt });
  return { status: 'ok', syncedAt };
}
