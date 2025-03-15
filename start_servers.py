#!/usr/bin/env python
"""
Start Script for One Click Labs
This script starts both the AI Text Generation server and the Backend API server.
"""

import os
import sys
import subprocess
import time
import signal
import atexit
from pathlib import Path

# Get the root directory of the project
ROOT_DIR = Path(__file__).parent.absolute()
AI_TEXT_GEN_DIR = ROOT_DIR / "ai_text_gen"
BACKEND_DIR = ROOT_DIR / "backend"

# Process holders
ai_process = None
backend_process = None

def cleanup_processes():
    """Terminate subprocesses on exit."""
    print("\nShutting down servers...")
    for process, name in [(ai_process, "AI Text Generation"), (backend_process, "Backend")]:
        if process and process.poll() is None:
            try:
                print(f"Terminating {name} server...")
                if sys.platform == 'win32':
                    process.terminate()
                else:
                    process.send_signal(signal.SIGTERM)
                process.wait(timeout=5)
                print(f"{name} server terminated.")
            except subprocess.TimeoutExpired:
                print(f"Forcing {name} server to close...")
                process.kill()
                print(f"{name} server force-closed.")
            except Exception as e:
                print(f"Error terminating {name} server: {e}")

# Register cleanup function to run when the script exits
atexit.register(cleanup_processes)

def start_server(directory, command, name):
    """Start a server in the specified directory using the given command."""
    try:
        print(f"Starting {name} server...")
        
        # Create a process to run the server
        process = subprocess.Popen(
            command,
            cwd=directory,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Wait a moment to ensure the process starts
        time.sleep(1)
        
        # Check if process started successfully
        if process.poll() is not None:
            print(f"{name} server failed to start. Exit code: {process.returncode}")
            stderr_output = process.stdout.read() if process.stdout else "No error output available"
            print(f"Error output: {stderr_output}")
            return None
        
        print(f"{name} server started successfully.")
        return process
    
    except Exception as e:
        print(f"Error starting {name} server: {e}")
        return None

def main():
    """Main function to start both servers."""
    print("=" * 60)
    print("Starting One Click Labs Servers")
    print("=" * 60)

    global ai_process, backend_process

    # Command to run AI Text Generation server
    ai_command = "python server.py" if sys.platform == 'win32' else "python3 server.py"
    ai_process = start_server(AI_TEXT_GEN_DIR, ai_command, "AI Text Generation")
    
    # Wait for AI server to initialize
    time.sleep(3)
    
    # Command to run Backend server
    backend_command = "python main.py" if sys.platform == 'win32' else "python3 main.py"
    backend_process = start_server(BACKEND_DIR, backend_command, "Backend")
    
    if ai_process and backend_process:
        print("\nAll servers started successfully!")
        print("AI Text Generation API running on: http://localhost:8001")
        print("Backend API running on: http://localhost:8000")
    else:
        print("\nFailed to start all servers. Please check the error messages above.")
        return 1
    
    print("\nPress Ctrl+C to stop the servers.")
    
    # Monitor the processes and print their output
    try:
        while True:
            # Check if processes are still running
            if ai_process.poll() is not None:
                print(f"AI Text Generation server stopped unexpectedly with code {ai_process.returncode}")
                break
                
            if backend_process.poll() is not None:
                print(f"Backend server stopped unexpectedly with code {backend_process.returncode}")
                break
            
            # Process output from AI server
            if ai_process.stdout:
                line = ai_process.stdout.readline()
                if line:
                    print(f"[AI Server] {line.strip()}")
            
            # Process output from Backend server
            if backend_process.stdout:
                line = backend_process.stdout.readline()
                if line:
                    print(f"[Backend] {line.strip()}")
            
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received. Shutting down servers...")
    finally:
        cleanup_processes()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())