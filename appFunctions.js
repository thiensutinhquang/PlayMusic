 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/appFunctions.js
index 0000000000000000000000000000000000000000..a2ea09e3b43cb2b9d6f651ea363b052f8389cd1d 100644
--- a//dev/null
+++ b/appFunctions.js
@@ -0,0 +1,50 @@
+export async function fetchAudiusData(fetchImpl = globalThis.fetch) {
+  const state = globalThis.state || {};
+  if (state.isFetchingAllData) {
+    return;
+  }
+  state.isFetchingAllData = true;
+  try {
+    const res = await fetchImpl('https://api.audius.co');
+    const data = await res.json();
+    state.originalSongData = data;
+    return data;
+  } finally {
+    state.isFetchingAllData = false;
+  }
+}
+
+export async function shareSong(navigatorObj = globalThis.navigator, copyFn = () => {}) {
+  const state = globalThis.state || {};
+  const song = state.currentFilteredSongs?.[state.currentSongIndex];
+  if (!song || !song.permalink) return;
+  const shareUrl = `https://audius.co${song.permalink}`;
+  const shareData = {
+    title: `Nghe "${song.title}" - ${song.artist}`,
+    text: `Nghe bài hát "${song.title}" của ${song.artist} trên Play Nhạc MSTQ.`,
+    url: shareUrl
+  };
+  if (navigatorObj && typeof navigatorObj.share === 'function') {
+    return navigatorObj.share(shareData);
+  }
+  copyFn(shareUrl);
+  return shareUrl;
+}
+
+export function downloadLyrics(documentObj = globalThis.document) {
+  const state = globalThis.state || {};
+  const song = state.currentFilteredSongs?.[state.currentSongIndex];
+  if (!song || !song.description || song.description.trim() === 'Không có lời bài hát cho bài này.') {
+    return;
+  }
+  const filename = `${song.title} - ${song.artist}.txt`;
+  const text = song.description.replace(/\n/g, '\r\n');
+  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
+  const link = documentObj.createElement('a');
+  link.href = URL.createObjectURL(blob);
+  link.download = filename;
+  documentObj.body.appendChild(link);
+  link.click();
+  documentObj.body.removeChild(link);
+  URL.revokeObjectURL(link.href);
+}
 
EOF
)
