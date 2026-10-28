import argparse, json, os, sys, re, wave
from pathlib import Path
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
import torch
torch.set_num_threads(min(4, torch.get_num_threads()))
torch.manual_seed(0)
from transformers import AutoTokenizer, VitsModel
import numpy as np

def die(msg):
    sys.stderr.write(msg + "\n")
    sys.exit(1)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    try:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))
        text = data["text"]; lang = data["lang"]; model_dir = data["model_dir"]
    except Exception as e:
        die(f"Invalid TTS input JSON: {e}")
    allowed = {"en": "mms-tts-eng", "hi": "mms-tts-hin", "kn": "mms-tts-kan"}
    if lang not in allowed:
        die(f"Unsupported language '{lang}'. Allowed: en, hi, kn.")
    if not Path(model_dir).exists():
        die(f"Model not found locally: {model_dir}. Run setup to download models while online.")
    try:
        model_path = Path(model_dir)
        if not any(model_path.iterdir()):
            die(f"Model directory empty: {model_dir}")
        # Some language packs (hi, kn) ship only model.safetensors. Mirror the
        # English Vits config/tokenizer so the same architecture loads everywhere.
        eng = Path(ROOT) / "data" / "models" / "mms-tts-eng" if (ROOT := os.environ.get("BLU_ROOT")) else None
        if not eng or not eng.exists():
            eng = Path(__file__).resolve().parent.parent / "data" / "models" / "mms-tts-eng"
        for fname in ("config.json", "tokenizer_config.json", "special_tokens_map.json", "vocab.json"):
            src = eng / fname
            dst = model_path / fname
            if src.exists() and not dst.exists():
                import shutil
                shutil.copy2(src, dst)
        # Mirrored config may have a vocab_size that differs from the checkpoint
        # (e.g. en=38, hi=72, kn=?). Read the real size from model.safetensors
        # and patch config.json so VitsModel loads cleanly.
        safetensors_file = model_path / "model.safetensors"
        if safetensors_file.exists() and (model_path / "config.json").exists():
            from safetensors import safe_open
            import json as _json
            vocab = None
            with safe_open(str(safetensors_file), framework="pt") as f:
                for key in f.keys():
                    if key.endswith("embed_tokens.weight") or key.endswith("embedding.weight"):
                        vocab = f.get_slice(key).get_shape()[0]
                        break
            if vocab:
                cfg = _json.loads((model_path / "config.json").read_text(encoding="utf-8"))
                cfg["vocab_size"] = int(vocab)
                (model_path / "config.json").write_text(_json.dumps(cfg, indent=2), encoding="utf-8")
        tokenizer = AutoTokenizer.from_pretrained(str(model_path), local_files_only=True)
        model = VitsModel.from_pretrained(str(model_path), local_files_only=True)
    except Exception as e:
        die(f"Could not load {allowed[lang]} model from {model_dir}: {e}")
    if not str(text).strip():
        die("Empty narration text.")
    try:
        script = {"en": re.compile(r"[a-zA-Z]"), "hi": re.compile(r"[\u0900-\u097f]"), "kn": re.compile(r"[\u0c80-\u0cff]")}[lang]
        if not script.search(str(text)):
            die(f"Narration text does not appear to be {lang}; refusing wrong-language synthesis.")
    except Exception:
        pass
    try:
        inputs = tokenizer(str(text), return_tensors="pt", padding=True)
        with torch.no_grad():
            out = model(**inputs).waveform
        arr = out.float().numpy().reshape(-1)
        if arr.size == 0 or not np.isfinite(arr).all():
            die(f"{allowed[lang]} produced empty or non-finite audio.")
        rate = int(model.config.sampling_rate)
        pcm = (arr * 32767).astype("<i2")
        with wave.open(args.output, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
            w.writeframes(pcm.tobytes())
    except Exception as e:
        die(f"{allowed[lang]} synthesis failed: {e}")

if __name__ == "__main__":
    main()