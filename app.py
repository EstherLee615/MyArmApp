import os
import json
import io
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from google import genai
from google.genai import types
from gtts import gTTS

app = Flask(__name__)
# 允許所有來源進行 CORS 存取
CORS(app, resources={r"/*": {"origins": "*"}})

# =======================================================
# 🔑 初始化 Gemini Client
# =======================================================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyA5WdvRKs97SUub0FPs33DqrRG5Tgdu_ro")
client = genai.Client(api_key=GEMINI_API_KEY)

# 記憶庫：暫存對話歷史
in_memory_history = []

def call_gemini_structured(user_input, history_list):
    # 使用當前尚在支援的標準 Flash 模型名稱
    model_id = "gemini-2.5-flash"
    
    system_instruction = """
    你是一位溫暖、同理且專業的心理諮商與頌缽音療引導師。
    請分析使用者的輸入，並回應 JSON 格式。
    primary_emotion 必須為：[快樂, 驚訝, 悲傷, 厭惡, 憤怒, 恐懼, 平靜] 其中的一個。
    """

    # 組合對話紀錄
    contents = []
    for msg in history_list:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg["text"])],
            )
        )
    
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_input)],
        )
    )

    generate_content_config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=[
                "is_out_of_scope",
                "primary_emotion",
                "emotion_intensity",
                "summary",
                "counselor_response",
                "relaxation_guidance",
                "safety_alert",
            ],
            properties={
                "is_out_of_scope": genai.types.Schema(type=genai.types.Type.BOOLEAN),
                "primary_emotion": genai.types.Schema(type=genai.types.Type.STRING),
                "emotion_intensity": genai.types.Schema(type=genai.types.Type.INTEGER),
                "summary": genai.types.Schema(type=genai.types.Type.STRING),
                "counselor_response": genai.types.Schema(type=genai.types.Type.STRING),
                "relaxation_guidance": genai.types.Schema(type=genai.types.Type.STRING),
                "safety_alert": genai.types.Schema(type=genai.types.Type.BOOLEAN),
            },
        ),
    )

    response = client.models.generate_content(
        model=model_id,
        contents=contents,
        config=generate_content_config,
    )
    return json.loads(response.text)

# =======================================================
# 🔌 API 路由 1：情緒分析
# =======================================================
@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    # 處理瀏覽器 CORS 預檢請求
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    global in_memory_history
    data = request.json or {}
    user_text = data.get('text', '').strip()

    if user_text == "clear_history":
        in_memory_history = []
        print("🧹 已重置歷史紀錄")
        return jsonify({"status": "success", "message": "History cleared"})

    if not user_text:
        return jsonify({"error": "No user text provided"}), 400

    try:
        # 呼叫 API
        analysis_result = call_gemini_structured(user_text, in_memory_history)
        ai_response_text = analysis_result.get("counselor_response", "收到您的訊息了，讓我們一起放鬆心情。")

        # 更新紀錄
        in_memory_history.append({"role": "user", "text": user_text})
        in_memory_history.append({"role": "model", "text": ai_response_text})

        return jsonify({
            "is_out_of_scope": analysis_result.get("is_out_of_scope", False),
            "counselor_response": ai_response_text,
            "primary_emotion": analysis_result.get("primary_emotion", "平靜"),
            "emotion_intensity": analysis_result.get("emotion_intensity", 1),
            "summary": analysis_result.get("summary", ""),
            "relaxation_guidance": analysis_result.get("relaxation_guidance", ""),
            "safety_alert": analysis_result.get("safety_alert", False),
            "full_history": in_memory_history
        })

    except Exception as e:
        print(f"❌ Gemini 呼叫失敗，觸發安全降級: {str(e)}")
        # 發生錯誤時提供安全降級回應，避免前端直接發送失敗爆掉
        fallback_msg = "聽起來你現在經歷了一些情緒，先試著深呼吸，將注意力放回身體上。"
        in_memory_history.append({"role": "user", "text": user_text})
        in_memory_history.append({"role": "model", "text": fallback_msg})

        return jsonify({
            "is_out_of_scope": False,
            "counselor_response": fallback_msg,
            "primary_emotion": "平靜",
            "emotion_intensity": 1,
            "summary": "系統暫時降級回應",
            "relaxation_guidance": "請著重於深呼吸",
            "safety_alert": False,
            "full_history": in_memory_history
        })

# =======================================================
# 🔌 API 路由 2：硬體感測器 (假數據)
# =======================================================
@app.route('/get_hardware_sensor', methods=['GET'])
def get_hardware_sensor():
    return jsonify({
        "Status": 1,
        "BPM": 72,
        "Avg_BPM": 72,
        "HRV_RMSSD": 42,
        "IBI": 830
    })

# =======================================================
# 🔌 API 路由 3：播放放鬆語音 (gTTS)
# =======================================================
def synthesize_voice(text, voice, language):
    if not text:
        return b""
    try:
        try:
            tts = gTTS(text=text, lang=language)
        except ValueError:
            tts = gTTS(text=text, lang="zh-CN")

        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        return mp3_fp.getvalue()
    except Exception as e:
        print(f"❌ gTTS 錯誤: {str(e)}")
        return b""

@app.route("/api/v1/voice/relax", methods=["POST", "OPTIONS"])
def generate_relax_voice():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    data = request.get_json() or {}
    text = data.get("text", "")
    voice = data.get("voice", "gentle_female")
    language = data.get("language", "zh-TW")

    if not text:
        return jsonify({"error": "text is empty"}), 400

    audio_bytes = synthesize_voice(text, voice, language)
    if not audio_bytes:
        return jsonify({"error": "voice synthesis failed"}), 500

    return Response(audio_bytes, mimetype="audio/mpeg")

if __name__ == "__main__":
    print("🚀 伺服器啟動中，監聽 http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)