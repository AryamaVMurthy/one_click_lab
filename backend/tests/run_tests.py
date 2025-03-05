"""
Script to run all tests in sequence with detailed reporting.
"""
import os
import sys
import subprocess
import time
from datetime import datetime

def run_tests():
    """Run all tests and generate a report."""
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    
    # Start the test server if needed
    # This is optional and depends on your setup
    
    # Set up the test environment
    os.environ["TESTING"] = "True"
    
    # Create a timestamp for the report
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = os.path.join(current_dir, f"test_report_{timestamp}.txt")
    
    # Print header
    print("\n" + "="*80)
    print(f"Running One Click Labs API Tests - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80 + "\n")
    
    # Run the tests
    start_time = time.time()
    
    # Define test modules to run
    test_modules = [
        "test_auth.py",
        "test_labs.py",
        "test_ai.py"
    ]
    
    # Results storage
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "errors": 0,
        "skipped": 0,
        "details": []
    }
    
    # Run each test module
    for module in test_modules:
        print(f"\nRunning tests in {module}...")
        module_path = os.path.join(current_dir, module)
        
        # Run pytest with detailed output
        command = [
            sys.executable, "-m", "pytest", 
            module_path, "-v", 
            "--no-header",
            "--disable-warnings"
        ]
        
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            cwd=backend_dir
        )
        
        # Process the output
        output = process.stdout
        error_output = process.stderr
        
        # Count test results
        passed = output.count("PASSED")
        failed = output.count("FAILED")
        errors = output.count("ERROR")
        skipped = output.count("SKIPPED")
        
        # Update totals
        results["total"] += passed + failed + errors + skipped
        results["passed"] += passed
        results["failed"] += failed
        results["errors"] += errors
        results["skipped"] += skipped
        
        # Store details
        results["details"].append({
            "module": module,
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "skipped": skipped,
            "output": output,
            "error_output": error_output
        })
        
        # Print summary for this module
        print(f"  Passed: {passed}, Failed: {failed}, Errors: {errors}, Skipped: {skipped}")
        
        # Print failures and errors
        if failed > 0 or errors > 0:
            print("\nFailures and Errors:")
            for line in output.split("\n"):
                if "FAILED" in line or "ERROR" in line:
                    print(f"  {line}")
    
    # Calculate elapsed time
    elapsed_time = time.time() - start_time
    
    # Print overall summary
    print("\n" + "="*80)
    print(f"Test Summary - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total tests: {results['total']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(f"Errors: {results['errors']}")
    print(f"Skipped: {results['skipped']}")
    print(f"Time elapsed: {elapsed_time:.2f} seconds")
    print("="*80 + "\n")
    
    # Generate report file
    with open(report_file, "w") as f:
        f.write("="*80 + "\n")
        f.write(f"One Click Labs API Test Report - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*80 + "\n\n")
        
        f.write("Summary:\n")
        f.write(f"Total tests: {results['total']}\n")
        f.write(f"Passed: {results['passed']}\n")
        f.write(f"Failed: {results['failed']}\n")
        f.write(f"Errors: {results['errors']}\n")
        f.write(f"Skipped: {results['skipped']}\n")
        f.write(f"Time elapsed: {elapsed_time:.2f} seconds\n\n")
        
        f.write("Detailed Results:\n")
        for detail in results["details"]:
            f.write(f"\nModule: {detail['module']}\n")
            f.write(f"Passed: {detail['passed']}, Failed: {detail['failed']}, ")
            f.write(f"Errors: {detail['errors']}, Skipped: {detail['skipped']}\n")
            f.write("\nOutput:\n")
            f.write(detail['output'])
            if detail['error_output']:
                f.write("\nError Output:\n")
                f.write(detail['error_output'])
            f.write("\n" + "-"*80 + "\n")
    
    print(f"Test report saved to: {report_file}")
    
    # Return overall success/failure
    return results["failed"] == 0 and results["errors"] == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
