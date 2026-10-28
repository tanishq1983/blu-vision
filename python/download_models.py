import argparse, os, sys
from pathlib import Path
os.environ["PYTHONUTF8"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
try:
    from huggingface_hub import snapshot_download
except Exception as e:
    print(f"ERROR: huggingface_hub not installed: {e}", file=sys.stderr); sys.exit(1)
os.environ["HF_HUB_OFFLINE"] = "0"
os.environ["TRANSFORMERS_OFFLINE"] = "0"
TTS_MODELS = {"en": "facebook/mms-tts-eng", "hi": "facebook/mms-tts-hin", "kn": "facebook/mms-tts-kan"}
TRANSLATION_MODEL = "ai4bharat/indictrans2-en-indic-dist-200M"
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--lang", nargs="*", choices=list(TTS_MODELS)+["all","translation"], default=["all"])
    p.add_argument("--root", default=None)
    args = p.parse_args()
    root = os.path.join(os.getcwd(), "data", "models") if args.root is None else args.root
    os.makedirs(root, exist_ok=True)
    langs = list(TTS_MODELS) if "all" in args.lang else [l for l in args.lang if l in TTS_MODELS]
    for lang in langs:
        dest = os.path.join(root, TTS_MODELS[lang].split("/")[-1])
        print(f"Downloading {TTS_MODELS[lang]} to {dest}")
        try:
            snapshot_download(repo_id=TTS_MODELS[lang], local_dir=dest, local_dir_use_symlinks=False, resume_download=True)
        except Exception as e:
            print(f"ERROR: Failed to download {TTS_MODELS[lang]}: {e}", file=sys.stderr); sys.exit(1)
    if "translation" in args.lang:
        print(f"Translation model {TRANSLATION_MODEL} is gated on Hugging Face; demo translations are pre-built and do not require it.")
if __name__ == "__main__":
    main()