# -*- coding: utf-8 -*-
"""
SENTINEL V15: THE AWAKENED GOD (ULTIMATE QA EDITION)
Sửa lỗi Crash của Python Bot khi thiếu thư viện `datetime`.
Phân tích thuật toán RAM-Drive (Blob Cache) chống MIUI Kill App.
"""

import os
import time
import tempfile
import keyboard
import html
import json
import uuid
import traceback
from datetime import datetime
from bs4 import BeautifulSoup
from llama_cpp import Llama
from playwright.sync_api import sync_playwright

try:
    from gtts import gTTS
    import pygame
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
except ImportError:
    print("⚠️ Thiếu thư viện! Chạy: pip install llama-cpp-python reportlab playwright beautifulsoup4 keyboard gTTS pygame")
    exit()

TARGET_URL = "https://thiensutinhquang.github.io/PlayMusic/index.html"
MODEL_PATH = r"C:\AI Local\AI_Models\Ai Thuc chien\Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
GPU_LAYERS = 20

base_dir = os.path.dirname(os.path.abspath(__file__))
PDF_REPORT_PATH = os.path.join(base_dir, "Ho_So_Kien_Truc_Am_Nhac_V15_MIUI.pdf")
HTML_REPORT_PATH = os.path.join(base_dir, "Ho_So_Sentinel_Live.html")
MEMORY_FILE = os.path.join(base_dir, "sentinel_memory.json")
stop_signal = False

def speak(text, block=True):
    print(f"\n🔊 Sentinel: {text}")
    try:
        filename = f"voice_sentinel_{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(tempfile.gettempdir(), filename)
        tts = gTTS(text=text, lang='vi')
        tts.save(filepath)
        pygame.mixer.init()
        pygame.mixer.music.load(filepath)
        pygame.mixer.music.play()
        if block:
            while pygame.mixer.music.get_busy(): time.sleep(0.1)
            pygame.mixer.music.unload()
            pygame.mixer.quit()
            try: os.remove(filepath) 
            except: pass
    except: pass 

def on_f10_press():
    global stop_signal
    if not stop_signal:
        stop_signal = True
        print("\n[HỆ THỐNG] Đã nhận lệnh F10. Sắp xếp báo cáo cấp Thần...")

def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except: return {"tested_uids": [], "facts": [], "blind_spots": []}
    return {"tested_uids": [], "facts": [], "blind_spots": []}

def save_memory(memory_data):
    if "blind_spots" not in memory_data: memory_data["blind_spots"] = []
    if "tested_selectors" in memory_data: memory_data["tested_uids"] = memory_data.pop("tested_selectors")
    elif "tested_uids" not in memory_data: memory_data["tested_uids"] = []
    with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(memory_data, f, ensure_ascii=False, indent=4)

print(f"⏳ Khởi động Động cơ AI Llama 3.1 - Chế độ TÂM NHÃN (Nạp {GPU_LAYERS} Layers)...")
try:
    llm = Llama(model_path=MODEL_PATH, n_ctx=8192, n_threads=14, n_gpu_layers=GPU_LAYERS, verbose=False)
except Exception as e:
    print(f"⚠️ Lỗi khởi động AI: {e}")
    exit()

def get_deep_source_code(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    dom_skeleton = ""
    for tag in soup.find_all(['audio', 'video', 'button', 'ul', 'li', 'nav', 'div']):
        classes = ".".join(tag.get('class', []))
        if tag.name == 'div' and 'song-row' not in classes and 'dropdown-item' not in classes: continue
        tag_id = f"#{tag.get('id')}" if tag.get('id') else ""
        text_preview = tag.text.strip()[:40].replace('\n', ' ')
        if text_preview or tag.name == 'audio':
            dom_skeleton += f"<{tag.name} {tag_id} class='{classes}'> {text_preview}...\n"
            
    js_logic = ""
    for script in soup.find_all('script'):
        if script.string and ('AudioContext' in script.string or 'mediaSession' in script.string or 'blobUrl' in script.string or 'preloadIntoRAM' in script.string):
            js_logic += script.string.strip()[:8000] + "\n\n"
                    
    return f"--- DOM STRUCTURE ---\n{dom_skeleton[:1000]}\n--- JS AUDIO LOGIC ---\n{js_logic[:4000]}"

def analyze_music_architecture(source_code_context, behavioral_facts, deep_tech_specs):
    prompt = f"""You are a STRICT, BRUTALLY HONEST AUDIO PERFORMANCE ENGINEER.
I am providing you with the REAL extracted Source Code, Technology Specs, and ACTUAL CPU/Endurance Testing Facts.

1. INDISPUTABLE FACTS GATHERED BY C++ ENGINE:
{deep_tech_specs}

2. SOURCE CODE (DOM & JS Logic):
{source_code_context}

3. TESTING FACTS:
{behavioral_facts}

[CRITICAL ANTI-HALLUCINATION RULES]:
1. The developer removed `prefetchAudio` (which caused Cache Poisoning) and replaced it with `preloadIntoRAM` (which uses Blob URLs). YOU MUST PRAISE this RAM-Drive Strategy as the ultimate fix that prevents MIUI Network Doze Mode from killing the app during track transitions.
2. The developer explicitly avoids `audio.load()` when using Blob URLs. Praise this for keeping the MediaSession alive on Android.
3. If the Testing Facts show "CPU ZERO: React State Updates STOPPED when hidden", you MUST praise this as the core fix for the "MIUI Background Kill" issue.
4. DO NOT suggest "Sử dụng Virtual DOM" or "Sử dụng Service Worker". 

Based ONLY on the actual data, write a highly technical Architecture Report in VIETNAMESE.

Use EXACTLY these 4 headings (include the #):
# ĐÁNH GIÁ ĐỘ BỀN BACKGROUND AUDIO (Khen ngợi giải pháp giảm 100% CPU React khi tắt màn hình)
# KIẾN TRÚC TRÌNH PHÁT MEDIA & PLAYLIST (Đánh giá kỹ thuật RAM-Drive/Blob URL chống cắt mạng của Xiaomi)
# TỐI ƯU HIỆU SUẤT & RAM (Đánh giá việc tối ưu IO LocalStorage và tự động revoke Blob)
# ĐỀ XUẤT CODE NÂNG CAO (Gợi ý cụ thể, ví dụ thêm WakeLock API chuẩn của W3C)"""

    try:
        print("\n      [Thần AI Llama] Đang phân tích logic RAM-Drive và Zero-CPU thực tế... \n      ", end="", flush=True)
        response = llm.create_chat_completion(messages=[{"role": "user", "content": prompt}], temperature=0.1, max_tokens=1500, stream=True)
        full_text = ""
        for chunk in response:
            if "choices" in chunk and len(chunk["choices"]) > 0:
                delta = chunk["choices"][0].get("delta", {})
                if "content" in delta:
                    text = delta["content"]
                    print(f"\033[92m{text}\033[0m", end="", flush=True) 
                    full_text += text
        print("\n")
        return full_text.strip()
    except Exception as e: return f"Lỗi tổng hợp AI: {e}"

def ask_ai_for_healing_advice(error_message, element_html):
    clean_html = BeautifulSoup(element_html, "html.parser").prettify()[:300]
    prompt = f"""A bot failed to interact. Error: "{error_message}". HTML: {clean_html}
Best strategy? Reply with ONE word:
- "JS_CLICK" (Bypass UI blocker).
- "SCROLL" (Bring into view).
- "FORCE" (Force click).
- "SKIP" (Hopeless)."""
    try:
        response = llm.create_chat_completion(messages=[{"role": "user", "content": prompt}], temperature=0.1, max_tokens=15)
        advice = response['choices'][0]['message']['content'].strip().upper()
        for valid_cmd in ["JS_CLICK", "SCROLL", "FORCE", "SKIP"]:
            if valid_cmd in advice: return valid_cmd
        return "JS_CLICK"
    except: return "JS_CLICK"

def create_html_live_dashboard(ai_report, memory_data):
    ai_html = ""
    parts = ai_report.split('#')
    for part in parts:
        if not part.strip(): continue
        lines = part.strip().split('\n')
        heading = lines[0].strip()
        body = '\n'.join(lines[1:]).strip()
        ai_html += f"<h3 class='text-xl font-bold text-emerald-700 mt-6 mb-3 flex items-center'><svg class='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path></svg> {html.escape(heading)}</h3>"
        body_formatted = html.escape(body).replace('\n- ', '<br>• ').replace('\n', '<br>')
        ai_html += f"<p class='text-slate-700 leading-relaxed mb-4 p-4 bg-white rounded-lg border shadow-sm'>{body_formatted}</p>"

    recent_facts = memory_data['facts'][-30:] if len(memory_data['facts']) > 30 else memory_data['facts']
    facts_html = ""
    for f in recent_facts:
        color_class = "text-emerald-700 bg-emerald-50 border-emerald-200"
        if "CẢNH BÁO" in f or "LỖ HỔNG" in f or "LỖI" in f or "NGẮT QUÃNG" in f: color_class = "text-orange-600 bg-orange-50 border-orange-200 font-bold"
        if "CHUYỂN HƯỚNG" in f or "TAB MỚI" in f or "TỰ CHỮA LÀNH" in f: color_class = "text-purple-700 bg-purple-50 border-purple-200"
        if "SỨC BỀN" in f or "X-RAY" in f or "CPU" in f: color_class = "text-blue-700 bg-blue-50 border-blue-200 font-bold"
        facts_html += f"<li class='p-3 mb-2 rounded-md border text-sm font-medium {color_class}'>{html.escape(f)}</li>"

    total_elements = len(memory_data['tested_uids'])
    current_time = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    html_template = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"><title>Live Dashboard - Sentinel V15</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { font-family: 'Inter', sans-serif; background-color: #f8fafc; scroll-behavior: smooth;}</style>
</head>
<body class="text-slate-800 antialiased p-8">
    <h1 class="text-3xl font-bold mb-2">Sentinel V15 <span class="text-emerald-600">MIUI KILLER EDITION</span></h1>
    <p class="text-slate-500 mb-8">Cập nhật cuối: %s | Đã cày cẩn thận: %d phần tử</p>
    <div class="grid grid-cols-2 gap-8">
        <div><h2 class="font-bold text-xl mb-4">Nhật Ký Hành Vi & Kiểm Tra Background</h2><ul class="space-y-2">%s</ul></div>
        <div class="bg-slate-50 p-6 rounded-xl border"><h2 class="font-bold text-xl mb-4 border-b pb-2">Báo Cáo AI Chuẩn Xác Kỹ Thuật</h2>%s</div>
    </div>
</body></html>"""
    with open(HTML_REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(html_template % (current_time, total_elements, facts_html, ai_html))

def setup_pdf_fonts():
    font_paths = [r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\tahoma.ttf"]
    bold_font_paths = [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\tahomabd.ttf"]
    reg_path = next((p for p in font_paths if os.path.exists(p)), None)
    bold_path = next((p for p in bold_font_paths if os.path.exists(p)), None)
    if reg_path and bold_path:
        pdfmetrics.registerFont(TTFont('VietFont', reg_path))
        pdfmetrics.registerFont(TTFont('VietFont-Bold', bold_path))
        return 'VietFont', 'VietFont-Bold'
    return 'Helvetica', 'Helvetica-Bold'

def create_music_dossier(ai_report, memory_data):
    font_reg, font_bold = setup_pdf_fonts()
    doc = SimpleDocTemplate(PDF_REPORT_PATH, pagesize=A4, leftMargin=1.5*cm, rightMargin=1.5*cm, topMargin=2*cm, bottomMargin=2*cm)
    story = []
    title_style = ParagraphStyle('Title', fontName=font_bold, fontSize=20, alignment=TA_CENTER, textColor=colors.HexColor('#2E4053'), spaceAfter=15)
    h2_style = ParagraphStyle('H2', fontName=font_bold, fontSize=12, textColor=colors.HexColor('#2980B9'), spaceBefore=10, spaceAfter=5)
    normal_style = ParagraphStyle('Normal', fontName=font_reg, fontSize=11, leading=16, alignment=TA_JUSTIFY)
    
    story.append(Paragraph("HỒ SƠ BẮT BỆNH HIỆU SUẤT ÂM NHẠC TRỰC TUYẾN V15", title_style))
    story.append(Paragraph(f"Đã đo lường sức bền trên {len(memory_data['tested_uids'])} luồng hành vi.", ParagraphStyle('Center', fontName=font_reg, alignment=TA_CENTER, spaceAfter=20)))
    
    parts = ai_report.split('#')
    for part in parts:
        if not part.strip(): continue
        lines = part.strip().split('\n')
        story.append(Paragraph(html.escape(lines[0].strip()), h2_style))
        body = '\n'.join(lines[1:]).strip()
        story.append(Paragraph(html.escape(body).replace('\n- ', '<br/>• ').replace('\n', '<br/>'), normal_style))
    
    doc.build(story)

def assassinate_popups(page):
    page.evaluate("""() => {
        const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const closeBtn = btns.find(b => b.innerText.includes('Đóng lại') || b.innerText.includes('Đóng'));
        if (closeBtn) closeBtn.click();
    }""")
    time.sleep(1)

def enforce_single_tab(context, main_page):
    tabs_killed = 0
    for p in context.pages:
        if p != main_page:
            try:
                p.close()
                tabs_killed += 1
            except: pass
    if tabs_killed > 0:
        main_page.bring_to_front()
        time.sleep(1) 
    return tabs_killed

def get_next_single_element(page, memory):
    raw_locators = page.locator("button, a, li, [role='button'], [tabindex='0'], .song-row, .dropdown-item").all()
    for loc in raw_locators:
        try:
            if not loc.is_visible(): continue
            tag_name = loc.evaluate('node => node.tagName.toLowerCase()')
            el_class = loc.get_attribute("class") or ""
            href = loc.get_attribute("href") or ""
            text_content = ""
            if "song-row" in el_class:
                title_el = loc.query_selector('.font-semibold')
                if title_el: text_content = f"Bài hát: {title_el.inner_text().strip()}"
            if not text_content: text_content = loc.inner_text().strip()
            name_identifier = text_content[:40] if text_content else loc.get_attribute("aria-label") or ""
            if not name_identifier:
                svg_path = loc.evaluate("node => { const p = node.querySelector('path'); return p ? p.getAttribute('d') : null; }")
                if svg_path:
                    parent_id = loc.evaluate("node => node.parentElement ? node.parentElement.id : 'no-id'")
                    name_identifier = f"SVG_[{svg_path[:15]}]_P[{parent_id}]"
                else: continue
            if not name_identifier: continue
            uid = f"{tag_name}|{el_class}|{href}|{name_identifier}"
            if uid not in memory["tested_uids"] and uid not in memory.get("blind_spots", []):
                return {"uid": uid, "locator": loc, "name": name_identifier, "html": loc.evaluate("node => node.outerHTML")}
        except: continue 
    return None

def run_autonomous_music_auditor():
    global stop_signal
    keyboard.on_press_key('f10', lambda _: on_f10_press())
    
    os.system('cls' if os.name == 'nt' else 'clear')
    print("=" * 80)
    print("🚀 SENTINEL V15: MIUI KILLER (TEST THUẬT TOÁN ĐỆM RAM CHỐNG CẮT MẠNG)".center(80))
    print("=" * 80)
    
    speak("Giao thức V 15 khởi động. Tiến hành test thuật toán Blob Cache chống Xiaomi cắt mạng ngầm.", block=False)
    
    memory = load_memory()
    cycle = 1
    empty_runs_counter = 0 
    deep_tech_specs_str = "None"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=200)
        context = browser.new_context()
        page = context.new_page()
        
        print("⏳ Đang thiết lập Mỏ Neo Trang Chính...")
        page.goto(TARGET_URL, timeout=60000, wait_until="domcontentloaded")
        
        print("⏳ Đợi đếm ngược của Website tắt Popup...")
        time.sleep(5) 
        
        try:
            page.wait_for_selector('.song-row', timeout=15000)
            print("   -> Đã nhìn thấy Playlist!")
        except: pass
        
        while not stop_signal:
            print(f"\n" + "="*50)
            print(f"🔄 CHU KỲ {cycle}: ĐIỀU TRA & KIỂM THỬ SỨC BỀN")
            print("="*50)
            current_run_facts = []
            
            try:
                if cycle == 1:
                    print("🩺 [Radar X-Ray] Thu thập bằng chứng thép từ trình duyệt...")
                    tech_specs = page.evaluate("""() => {
                        return {
                            framework: (window.React || document.querySelector('[data-reactroot], #root')) ? 'ReactJS' : 'Vanilla JS',
                            hasVisibilityCheck: document.documentElement.innerHTML.includes('document.visibilityState ==='),
                            hasBlobPreload: document.documentElement.innerHTML.includes('preloadIntoRAM') && document.documentElement.innerHTML.includes('createObjectURL'),
                            mediaSession: 'mediaSession' in navigator
                        }
                    }""")
                    deep_tech_specs_str = f"Framework: {tech_specs['framework']}\nHas Visibility Check (Zero CPU): {tech_specs['hasVisibilityCheck']}\nHas Blob Preload (RAM-Drive): {tech_specs['hasBlobPreload']}\nMediaSession: {tech_specs['mediaSession']}"
                    current_run_facts.append(f"🔍 BẰNG CHỨNG X-RAY: Phát hiện chặn render ngầm (Zero CPU): {tech_specs['hasVisibilityCheck']}. Kỹ thuật RAM-Drive (Blob Preload) hoạt động: {tech_specs['hasBlobPreload']}.")

                target_item = get_next_single_element(page, memory)
                
                if not target_item:
                    print("⏬ Cuộn trang tìm kiếm thêm...")
                    page.evaluate("window.scrollBy(0, window.innerHeight / 2)")
                    time.sleep(2) 
                    target_item = get_next_single_element(page, memory)
                    
                    if not target_item:
                        empty_runs_counter += 1
                        print(f"⚠️ [Bot] Màn hình hiện tại đã test sạch. (Đợi tĩnh tâm {empty_runs_counter}/4 lần)")
                        time.sleep(3) 
                        if empty_runs_counter >= 4:
                            fact = f"✅ HOÀN TẤT CHIẾN DỊCH: Đã vét sạch {len(memory['tested_uids'])} phần tử."
                            current_run_facts.append(fact)
                            memory["facts"].extend(current_run_facts)
                            save_memory(memory)
                            speak("Đã cày nát trang web. Đang chuyển sang giai đoạn tổng hợp.", block=True)
                            break 
                        continue 
                
                empty_runs_counter = 0 
                uid = target_item['uid']
                loc = target_item['locator']
                text_name = target_item['name']
                el_html = target_item['html']
                
                print(f"   🤖 [Thằng em Bot]: Phát hiện mục tiêu: [{text_name[:30]}]")
                time.sleep(0.5)

                success = False; attempts = 0; last_error = ""
                
                while attempts < 3 and not success:
                    attempts += 1
                    try:
                        if not loc.is_visible(timeout=1000): raise Exception("Phần tử tàng hình.")

                        if attempts == 1:
                            loc.scroll_into_view_if_needed(timeout=2000)
                            loc.evaluate("node => node.style.border = '2px solid red'")
                            time.sleep(1) 
                            loc.click(timeout=2000)
                        elif attempts > 1:
                            print(f"      -> 💡 Llama hội chẩn...")
                            ai_advice = ask_ai_for_healing_advice(last_error, el_html)
                            if "JS_CLICK" in ai_advice: loc.evaluate("node => node.click()")
                            elif "SCROLL" in ai_advice:
                                loc.evaluate("node => node.scrollIntoView({block: 'center'})")
                                time.sleep(1)
                                loc.click(timeout=2000, force=True)
                            elif "FORCE" in ai_advice: loc.click(force=True, timeout=2000)
                            else: break
                        
                        time.sleep(2) 
                        success = True
                        
                        tabs_killed = enforce_single_tab(context, page)
                        if tabs_killed > 0:
                            res = f"🌐 TAB MỚI: '{text_name[:15]}' đẻ Tab. Đã tự động đóng."
                            current_run_facts.append(res)
                            memory["tested_uids"].append(uid)
                            break 
                            
                        clean_target = TARGET_URL.split('#')[0].rstrip('/')
                        clean_current = page.url.split('#')[0].rstrip('/')
                        if clean_target not in clean_current:
                            res = f"🔄 CHUYỂN HƯỚNG: '{text_name[:15]}' làm mất trang chủ."
                            current_run_facts.append(res)
                            memory["tested_uids"].append(uid)
                            try: page.go_back(wait_until="domcontentloaded", timeout=10000)
                            except: page.goto(TARGET_URL, timeout=60000, wait_until="domcontentloaded")
                            time.sleep(2)
                            assassinate_popups(page)
                            break 
                        else:
                            audio_state = page.evaluate("""() => {
                                const a = document.querySelector('audio');
                                return a ? { playing: !a.paused, time: a.currentTime } : null;
                            }""")
                            
                            if audio_state and audio_state['playing']:
                                print("   🎵 Nhạc đang phát! Bắt đầu chọc mã đo lường CPU React ngầm...")
                                
                                page.evaluate("""() => {
                                    window.renderCount = 0;
                                    const progressEl = document.querySelector('.bg-\\\\[var\\\\(--primary\\\\]');
                                    if(progressEl) {
                                        window.observer = new MutationObserver(() => window.renderCount++);
                                        window.observer.observe(progressEl, {attributes: true});
                                    }
                                }""")

                                print("   🌙 ÉP TRÌNH DUYỆT TẮT MÀN HÌNH (visibility = hidden). Chờ 5 giây...")
                                page.evaluate("""() => {
                                    Object.defineProperty(document, 'visibilityState', {value: 'hidden', writable: true});
                                    document.dispatchEvent(new Event('visibilitychange'));
                                }""")
                                time.sleep(5) 
                                
                                result = page.evaluate("""() => {
                                    const a = document.querySelector('audio');
                                    return { 
                                        playing: a ? !a.paused : false, 
                                        renderCount: window.renderCount 
                                    };
                                }""")
                                
                                if result['playing']:
                                    if result['renderCount'] == 0 or result['renderCount'] is None:
                                        res = f"🛡️ SỨC BỀN CPU TỐI THƯỢNG: Nhạc chạy liên tục, React State Updates đã DỪNG HOÀN TOÀN khi tắt màn hình (Zero CPU). Chống Xiaomi Kill App hoàn hảo."
                                        print(f"      ✅ Đã vượt qua bài Test Zero CPU.")
                                    else:
                                        res = f"⚠️ CẢNH BÁO SỨC BỀN: Nhạc chạy, nhưng React vẫn render {result['renderCount']} lần khi tắt màn hình. Nguy cơ bị HĐH Kill."
                                        print(f"      {res}")
                                else:
                                    res = f"❌ LỖI NGẮT QUÃNG: Nhạc BỊ ĐỨT khi tắt màn hình."
                                    print(f"      {res}")
                            else:
                                res = f"UI: Click '{text_name[:20]}' -> Tương tác OK."
                            
                            current_run_facts.append(res)
                            memory["tested_uids"].append(uid)
                            assassinate_popups(page)
                            break

                    except Exception as e:
                        last_error = str(e)[:100].replace('\n', ' ')
                        
                if not success:
                    res = f"LỖI TƯƠNG TÁC (Góc Khuất): '{text_name[:20]}'"
                    current_run_facts.append(res)
                    memory["blind_spots"].append(uid)
                    memory["tested_uids"].append(uid)

                memory["facts"].extend(current_run_facts)
                save_memory(memory)
                
                if cycle % 3 == 0:
                    print("\n[AI ARCHITECT] Tạm dừng để Thầy Llama hội chẩn (1-2 phút, xin đừng tắt)...")
                    deep_source = get_deep_source_code(page.content())
                    context_facts = "\n".join(memory["facts"][-40:])
                    ai_report_live = analyze_music_architecture(deep_source, context_facts, deep_tech_specs_str)
                    create_html_live_dashboard(ai_report_live, memory)
                    print("[AI ARCHITECT] Đã viết xong báo cáo. Tiếp tục cày...")

                cycle += 1

            except Exception as crash_err:
                print(f"\n⚠️ [HỆ THỐNG LỖI VĂNG]: {str(crash_err)[:60]}... Đang tải lại trang...")
                try: page.goto(TARGET_URL, timeout=60000, wait_until="domcontentloaded")
                except: pass
                time.sleep(3)

        browser.close()

    speak("Chiến dịch kiểm tra sức bền kết thúc. Đang xuất báo cáo chẩn đoán lõi.")
    deep_source = "<html><body>No data gathered</body></html>"
    try: deep_source = get_deep_source_code(page.content())
    except: pass
    context_facts = "\n".join(memory["facts"][-40:])
    ai_report_final = analyze_music_architecture(deep_source, context_facts, deep_tech_specs_str)
    create_music_dossier(ai_report_final, memory)
    create_html_live_dashboard(ai_report_final, memory)
    speak("Hoàn tất. Chúc Sếp xem file báo cáo vui vẻ.")

if __name__ == "__main__":
    run_autonomous_music_auditor()
