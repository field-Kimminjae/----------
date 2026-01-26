
import os

def check_integrity(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    seen_words = set()
    cleaned_lines = []
    duplicates_removed = 0
    format_errors = []
    
    # Process lines
    for line_num, line in enumerate(lines, 1):
        stripped_line = line.strip()
        if not stripped_line:
            continue

        parts = [p.strip() for p in stripped_line.split('|')]
        
        # Format Check
        if len(parts) != 3:
            format_errors.append((line_num, stripped_line))
            # We still keep format errors in the file so the user can fix them, 
            # unless it's a duplicate of a valid line seen before? 
            # Hard to say if a malformed line defines a "word". 
            # Let's assume we keep it to be safe, but we won't count it as a "valid word".
            cleaned_lines.append(line)
            continue
            
        word = parts[0]
        
        # Duplicate Check
        if word in seen_words:
            duplicates_removed += 1
            continue # Skip writing this line (delete duplicate)
        
        seen_words.add(word)
        cleaned_lines.append(line)

    # Write back cleaned data
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)

    # Report
    print(f"--- Integrity Check Report ---")
    print(f"Original Line Count: {len(lines)}")
    print(f"Duplicates Removed: {duplicates_removed}")
    print(f"Format Errors Found: {len(format_errors)}")
    
    if format_errors:
        print("\n[Format Errors (Line: Content)]")
        for num, content in format_errors:
            print(f"Line {num}: {content}")
    else:
        print("\nNo format errors found.")

    final_count = len(cleaned_lines)
    # If we kept format errors, the "learnable words" count is (Final Include - Format Errors)
    learnable_count = final_count - len(format_errors)
    
    print(f"\nFinal Line Count in File: {final_count}")
    print(f"Total Learnable Words: {learnable_count}")
    
    if len(format_errors) == 0:
        print("\nStatus: File is CLEAN and ready for GitHub.")
    else:
        print("\nStatus: File contains format errors. Please review.")
    
    print("Filesystem updated.")

if __name__ == "__main__":
    import sys
    # Force utf-8 output for Windows console to avoid mojibake/errors
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except AttributeError:
            pass # Old python
            
    check_integrity(r"c:\toeic-jlpt-app\jlpt-quiz\jlpt_data.txt")
