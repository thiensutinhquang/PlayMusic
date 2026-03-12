# -*- coding: utf-8 -*-
"""
SENTINEL V16.5: THE MSE CORE ANALYZER
Mục tiêu: Đánh giá xem kiến trúc V30 (The Suno Engine) của MSTQ Music 
có thực sự đã áp dụng thành công MediaSource Extensions và Blob URL hay chưa.
"""

import os
import time
import keyboard
import json
import traceback
import html
from bs4 import BeautifulSoup
from llama_cpp import Llama
from playwright.sync_api import sync_playwright

# =====================================================================
# CẤU HÌNH HỆ THỐNG
# =====================================================================
TARGET_URL = "https://thiensutinhquang.github.io/PlayMusic/index.html" 
MODEL_PATH = r"C:\AI Local\AI_Models\Ai Thuc chien\Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
GPU_LAYERS = 20

base_dir = os.path.dirname(os.path.abspath(__file__))
REPORT_PATH = os.path.join(base_dir, "Bao_Cao_Tinh_Bao_MSTQ_V30.html")

spy_data = {
    "network_requests": [],
    "transition_logs": []
}
start_spy = False

def on_f8_press():
    global start_spy
    if not start_spy:
        start_spy = True
        print("\n[ĐIỆP VIÊN] Đã nhận lệnh F8! Bắt đầu phân tích cấu trúc MSE của MSTQ Music...")

def handle_network_request(request):
    if not start_spy: return
    url = request.url.lower()
    if any(ext in url for ext in [".mp3", ".wav", ".m4a", ".m3u8", ".ts", "blob:", "stream", "audio"]):
        req_info = f"[{request.method}] {request.url[:120]}..."
        if req_info not in spy_data["network_requests"]:
            spy_data["network_requests"].append(req_info)
            print(f"   📡 [MSTQ Network] Kéo data: {request.url[:70]}...")

# =====================================================================
# AI CORE - CHUYÊN GIA DỊCH NGƯỢC
# =====================================================================
print(f"⏳ Khởi động Động cơ AI Llama 3.1 - (Nạp {GPU_LAYERS} Layers)...")
try:
    llm = Llama(model_path=MODEL_PATH, n_ctx=8192, n_threads=14, n_gpu_layers=GPU_LAYERS, verbose=False)
except Exception as e:
    print(f"⚠️ Lỗi khởi động AI: {e}")
    exit()

def analyze_stolen_data(tech_specs, network_logs, transition_logs):
    prompt = f"""You are an Elite Reverse Engineer evaluating the MSTQ Music App V30.
Our goal is to confirm if the developer successfully implemented the "Suno Hack" (using MediaSource Extensions and Blob URLs) to prevent Android MIUI from muting audio in the background.

1. DEEP TECH SPECS:
{json.dumps(tech_specs, indent=2)}

2. NETWORK STREAMING LOGS:
{chr(10).join(network_logs[-30:])}

3. TRACK TRANSITION LOGS (What happens when songs change in the dark):
{chr(10).join(transition_logs)}

[CRITICAL ANTI-HALLUCINATION RULES]:
1. Read the Transition Logs carefully. Does the `src` of the audio tag start with 'blob:'? If yes, it means MSE is active!
2. Do the Transition Logs show that the `src` stays exactly the same across track changes, while the network logs show new `.mp3` files being fetched? If yes, it means they are successfully appending buffer to a single Blob URL!
3. Praise the developer if they achieved the "Suno Hack".

Based ONLY on the evidence above, evaluate the architecture in VIETNAMESE.

Use EXACTLY these 3 headings (include the #):
# XÁC NHẬN KIẾN TRÚC MSE (Xác nhận xem SRC của thẻ Audio có phải là Blob không)
# ĐÁNH GIÁ LUỒNG CHUYỂN BÀI NGẦM (Khi qua bài 2, bài 3, SRC có giữ nguyên không? Mạng có kéo file mp3 mới không?)
# KẾT LUẬN VỀ KHẢ NĂNG CHỐNG MIUI (Đánh giá mức độ thành công của kỹ thuật này so với Suno)"""

    try:
        print("\n      [AI Dịch Ngược] Đang đánh giá kỹ thuật MSE của MSTQ Music... \n      ", end="", flush=True)
        response = llm.create_chat_completion(messages=[{"role": "user", "content": prompt}], temperature=0.1, max_tokens=1500, stream=True)
        full_text = ""
        for chunk in response:
            if "choices" in chunk and len(chunk["choices"]) > 0:
                delta = chunk["choices"][0].get("delta", {})
                if "content" in delta:
                    text = delta["content"]
                    print(f"\033[93m{text}\033[0m", end="", flush=True) 
                    full_text += text
        print("\n")
        return full_text.strip()
    except Exception as e: return f"Lỗi tổng hợp AI: {e}"

# =====================================================================
# XUẤT BÁO CÁO HTML
# =====================================================================
def generate_spy_report(tech_specs, network_logs, transition_logs, ai_report):
    ai_html = ""
    parts = ai_report.split('#')
    for part in parts:
        if not part.strip(): continue
        lines = part.strip().split('\n')
        heading = lines[0].strip()
        body = '\n'.join(lines[1:]).strip()
        ai_html += f"<h3 class='text-xl font-bold text-emerald-700 mt-6 mb-3'>🕵️ {html.escape(heading)}</h3>"
        body_formatted = html.escape(body).replace('\n- ', '<br>• ').replace('\n', '<br>')
        ai_html += f"<p class='text-slate-700 leading-relaxed mb-4 p-5 bg-emerald-50 rounded-lg border border-emerald-200 shadow-inner'>{body_formatted}</p>"

    net_html = "".join([f"<li class='py-1 font-mono text-[11px] text-blue-700 border-b border-slate-100'>{html.escape(req)}</li>" for req in network_logs])
    trans_html = "".join([f"<li class='py-1 font-mono text-[12px] text-teal-700 border-b border-slate-100'>{html.escape(req)}</li>" for req in transition_logs])

    html_template = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"><title>Hồ Sơ Giám Định - MSTQ Music V30</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body {{ font-family: 'Inter', sans-serif; background-color: #f0fdf4; }}</style>
</head>
<body class="text-slate-800 p-8">
    <div class="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h1 class="text-4xl font-black mb-2 text-slate-900 border-b-4 border-emerald-500 pb-4">Hồ Sơ Giám Định: <span class="text-emerald-600">MSTQ Music V30 (Suno Engine)</span></h1>
        <p class="text-slate-500 mb-8 font-mono">Đo lường cấu trúc Blob MSE bởi Sentinel V16.5</p>
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-5 space-y-6">
                <div class="bg-slate-900 text-green-400 p-4 rounded-xl shadow">
                    <h2 class="font-bold text-white mb-2 border-b border-slate-700 pb-2">Thông Số Kỹ Thuật (Raw)</h2>
                    <pre class="text-[10px] overflow-x-auto whitespace-pre-wrap">{html.escape(json.dumps(tech_specs, indent=2))}</pre>
                </div>
                <div class="bg-teal-50 border border-teal-200 p-4 rounded-xl shadow">
                    <h2 class="font-bold text-teal-800 mb-2 border-b border-teal-200 pb-2">Nhật Ký Đổi Bài Trong Đêm</h2>
                    <ul class="max-h-64 overflow-y-auto">{trans_html}</ul>
                </div>
                <div class="bg-white border border-slate-200 p-4 rounded-xl shadow">
                    <h2 class="font-bold text-slate-800 mb-2 border-b pb-2">Luồng Network Stream</h2>
                    <ul class="max-h-64 overflow-y-auto">{net_html}</ul>
                </div>
            </div>
            
            <div class="lg:col-span-7">
                <h2 class="text-2xl font-bold mb-4 bg-emerald-100 text-emerald-900 p-3 rounded-lg border border-emerald-300">Báo Cáo Phân Tích Bí Thuật (AI Llama)</h2>
                {ai_html}
            </div>
        </div>
    </div>
</body></html>"""

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(html_template)
    print(f"\n[+] Đã xuất Hồ sơ Giám định tại: {REPORT_PATH}")

# =====================================================================
# LÕI ĐIỆP VIÊN: GIAO THỨC THEO DÕI GIẤC NGỦ SÂU
# =====================================================================
def run_spy_mission():
    keyboard.on_press_key('f8', lambda _: on_f8_press())
    
    os.system('cls' if os.name == 'nt' else 'clear')
    print("=" * 80)
    print("🚀 SENTINEL V16.5: THE MSE CORE ANALYZER (GIÁM ĐỊNH V30)".center(80))
    print("=" * 80)
    
    with sync_playwright() as p:
        xiaomi_user_agent = "Mozilla/5.0 (Linux; Android 13; 2306EPN60G Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36"
        
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            user_agent=xiaomi_user_agent, 
            viewport={"width": 412, "height": 915}, 
            is_mobile=True, 
            has_touch=True
        )
        
        page = context.new_page()
        page.on("request", handle_network_request)
        
        print(f"⏳ Đang mở {TARGET_URL}...")
        page.goto(TARGET_URL)
        
        print("\n" + "="*60)
        print("🎯 BƯỚC TIẾP THEO: SẴN SÀNG THU THẬP TÌNH BÁO")
        print("1. Hãy bấm Play một bài hát trên MSTQ Music V30.")
        print("2. Khi nhạc ĐANG HÁT, nhấn phím F8 để Bot làm việc!")
        print("="*60 + "\n")
        
        while not start_spy:
            time.sleep(0.5)
            
        print("🔍 ĐÃ KÍCH HOẠT CHẾ ĐỘ QUÉT NGẦM! VUI LÒNG BỎ TAY KHỎI CHUỘT.")
        
        tech_specs = page.evaluate("""() => {
            const a = document.querySelector('audio, video');
            return {
                audio_src_initial: a ? a.src : 'No Audio Tag',
                is_blob_initial: a && a.src ? a.src.startsWith('blob:') : false,
                has_mse_code: document.documentElement.innerHTML.includes('MediaSource') && document.documentElement.innerHTML.includes('appendBuffer')
            }
        }""")

        print("🌙 ÉP TRÌNH DUYỆT TẮT MÀN HÌNH (Visibility = Hidden)...")
        page.evaluate("""() => {
            Object.defineProperty(document, 'visibilityState', {value: 'hidden', writable: true});
            document.dispatchEvent(new Event('visibilitychange'));
        }""")
        
        # VÒNG LẶP TEST 3 BÀI
        for i in range(1, 4):
            print(f"\n▶️ BÀI SỐ {i}: Đang tua nhanh để ép đổi bài trong bóng tối...")
            
            page.evaluate("""() => {
                const a = document.querySelector('audio, video');
                if(a && a.duration > 30) {
                    a.currentTime = a.duration - 15;
                }
            }""")
            
            print("⏳ Đợi 25s để tự động chuyển bài và Append Buffer...")
            time.sleep(25)
            
            state = page.evaluate("""() => {
                const a = document.querySelector('audio, video');
                return {
                    src: a ? a.src : 'None',
                    paused: a ? a.paused : true,
                    readyState: a ? a.readyState : 0,
                    currentTime: a ? a.currentTime : 0
                }
            }""")
            
            log_str = f"Chuyển sang Bài {i+1} | ReadyState: {state['readyState']} | Playing: {not state['paused']} | Src: {state['src'][:40]}..."
            spy_data["transition_logs"].append(log_str)
            print(f"   {log_str}")
        
        browser.close()
        
    print("\n[+] Đã lấy đủ dữ liệu Giám định. Gọi Llama ra viết báo cáo...")
    
    ai_report = analyze_stolen_data(tech_specs, spy_data["network_requests"], spy_data["transition_logs"])
    generate_spy_report(tech_specs, spy_data["network_requests"], spy_data["transition_logs"], ai_report)
    
    print("\n✅ HOÀN TẤT CHIẾN DỊCH GIÁM ĐỊNH. Báo cáo HTML đã được lưu!")

if __name__ == "__main__":
    run_spy_mission()
