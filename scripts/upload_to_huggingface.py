"""
Upload trained model to Hugging Face Hub for production deployment
"""

import os
import joblib
from pathlib import Path
from huggingface_hub import HfApi, create_repo, login
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configuration
HF_USERNAME = os.getenv("HF_USERNAME", "irfankarim")  # Your HF username
HF_TOKEN = os.getenv("HF_TOKEN")  # Will be loaded from .env
REPO_NAME = f"{HF_USERNAME}/fraud-detection-lightgbm-v1"
MODEL_DIR = Path("mlruns/models")  # Adjust to your model location

def upload_model():
    """Upload model artifacts to Hugging Face Hub"""
    
    print("🚀 Starting model upload to Hugging Face...")
    
    # Step 1: Check if token is available
    if not HF_TOKEN:
        print("\n❌ HF_TOKEN not found in environment variables!")
        print("💡 Please create a .env file with your Hugging Face token:")
        print("   HF_TOKEN=your_token_here")
        print("\n   Get your token from: https://huggingface.co/settings/tokens")
        return
    
    # Step 2: Login with token
    print(f"\n🔑 Logging in as: {HF_USERNAME}")
    try:
        login(token=HF_TOKEN)
        print("✅ Login successful!")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return
    
    # Step 2: Create repository
    print(f"\n📦 Creating repository: {REPO_NAME}")
    try:
        create_repo(
            repo_id=REPO_NAME,
            repo_type="model",
            exist_ok=True,
            private=False  # Set to True if you want private repo
        )
        print("✅ Repository created/verified!")
    except Exception as e:
        print(f"❌ Failed to create repository: {e}")
        return
    
    # Step 3: Find latest model
    latest_model = find_latest_model()
    if not latest_model:
        print("❌ No model found! Please train a model first using notebooks/04_train_with_mlflow.py")
        return
    
    print(f"📁 Found model at: {latest_model}")
    
    # Step 4: Upload files
    print(f"\n⬆️  Uploading model files...")
    api = HfApi()
    
    try:
        # Upload the entire model directory
        api.upload_folder(
            folder_path=str(latest_model),
            repo_id=REPO_NAME,
            repo_type="model",
            commit_message="Upload fraud detection model"
        )
        print("✅ Model uploaded successfully!")
        print(f"\n🎉 View your model at: https://huggingface.co/{REPO_NAME}")
        print(f"\n💡 Update your FastAPI backend to use: {REPO_NAME}")
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return


def find_latest_model():
    """Find the latest trained model in mlruns"""
    
    # Look for model in multiple possible locations
    possible_paths = [
        Path("mlruns/models"),
        Path("models"),
        Path("artifacts/model"),
    ]
    
    for base_path in possible_paths:
        if base_path.exists():
            # Find directories with model files
            model_files = list(base_path.rglob("*.pkl")) + list(base_path.rglob("*.joblib"))
            if model_files:
                # Return the parent directory of the first model found
                return model_files[0].parent
    
    # If no model found in standard locations, ask user
    print("\n⚠️  Could not find model automatically.")
    print("Please provide the path to your model directory:")
    user_path = input("Model directory path: ").strip()
    
    if user_path and Path(user_path).exists():
        return Path(user_path)
    
    return None


if __name__ == "__main__":
    print("=" * 60)
    print("🤗 Hugging Face Model Upload Script")
    print("=" * 60)
    
    upload_model()
