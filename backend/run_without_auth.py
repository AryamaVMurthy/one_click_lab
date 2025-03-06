"""
Script to run the One Click Labs API with authentication bypass enabled
"""
import os
import subprocess
import sys

def main():
    # Set environment variables for authentication bypass
    os.environ["AUTH_BYPASS"] = "true"
    
    print("🚀 Starting One Click Labs API with authentication bypass enabled")
    print("⚠️  WARNING: Authentication is disabled. Do not use in production!")
    print("📝 All API endpoints will use a mock admin user")
    
    # Run the main.py script with the environment variables set
    try:
        # Get the Python executable path
        python_exe = sys.executable
        
        # Run the main.py script
        subprocess.run([python_exe, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error running server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
