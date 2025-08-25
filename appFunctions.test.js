 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a//dev/null b/appFunctions.test.js
index 0000000000000000000000000000000000000000..b8263000fa6867d1f114e59862c821a4edc5016f 100644
--- a//dev/null
+++ b/appFunctions.test.js
@@ -0,0 +1,36 @@
+import { describe, it, expect, vi } from 'vitest';
+import { fetchAudiusData, shareSong } from './appFunctions.js';
+
+describe('fetchAudiusData', () => {
+  it('tải dữ liệu thành công', async () => {
+    const mockData = { foo: 'bar' };
+    const mockFetch = vi.fn().mockResolvedValue({
+      json: () => Promise.resolve(mockData)
+    });
+    global.state = { isFetchingAllData: false };
+    const data = await fetchAudiusData(mockFetch);
+    expect(mockFetch).toHaveBeenCalled();
+    expect(global.state.isFetchingAllData).toBe(false);
+    expect(global.state.originalSongData).toEqual(mockData);
+    expect(data).toEqual(mockData);
+  });
+
+  it('lỗi mạng đặt lại state.isFetchingAllData', async () => {
+    const mockFetch = vi.fn().mockRejectedValue(new Error('network'));
+    global.state = { isFetchingAllData: false };
+    await expect(fetchAudiusData(mockFetch)).rejects.toThrow('network');
+    expect(global.state.isFetchingAllData).toBe(false);
+  });
+});
+
+describe('shareSong', () => {
+  it('xử lý shareSong khi thiếu navigator.share', async () => {
+    const song = { title: 'Song', artist: 'Artist', permalink: '/s/1' };
+    global.state = { currentFilteredSongs: [song], currentSongIndex: 0 };
+    const copyFn = vi.fn();
+    const navigatorMock = {};
+    const url = await shareSong(navigatorMock, copyFn);
+    expect(copyFn).toHaveBeenCalledWith('https://audius.co/s/1');
+    expect(url).toBe('https://audius.co/s/1');
+  });
+});
 
EOF
)
