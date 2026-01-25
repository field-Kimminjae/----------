import os
import time
import re

# Files
INPUT_FILE = r"c:\토익 공부 웹사이트\jlpt-quiz\raw_input.txt"
OUTPUT_FILE = r"c:\토익 공부 웹사이트\jlpt-quiz\jlpt_data.txt"
HISTORY_FILE = r"c:\토익 공부 웹사이트\jlpt-quiz\processed_history.txt"

def parse_and_append():
    """Reads input, parses it, and appends to output and history."""
    
    # 1. Read Input
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading input file: {e}")
        return

    if not lines:
        return # Empty file

    print(f"Detected {len(lines)} lines. Processing...")

    entries = []
    current_entry = None

    # Regex (Same as parse_vocab.py)
    # Match: Word (Reading) [Meaning] OR Word [Meaning]
    item_pattern = re.compile(r'^(.+?)(?:\s*\((.+?)\))?\s*\[(.+?)\]$')

    # 2. Parse Logic
    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Skip headers / comments
        if "페이지" in line or line.startswith("(") and "행)" in line:
             continue
        if line.startswith("(") and ")" in line and not "[" in line:
             continue

        # Check for Synonym line
        if line.startswith('≒'):
            if current_entry:
                synonym_content = line
                current_entry['meaning'] += f" ({synonym_content})"
            else:
                print(f"Warning: Orphaned synonym line: {line}")
            continue

        # Check for New Item line
        match = item_pattern.match(line)
        if match:
            if current_entry:
                entries.append(current_entry)
            
            word = match.group(1).strip()
            reading = match.group(2).strip() if match.group(2) else word
            meaning = match.group(3).strip()

            current_entry = {
                'word': word,
                'reading': reading,
                'meaning': meaning
            }
        else:
            print(f"Skipping unmatched line: {line}")

    if current_entry:
        entries.append(current_entry)

    if not entries:
        print("No valid entries found.")
        return

    # 3. Write to Output (Append)
    new_lines = []
    for entry in entries:
        line_out = f"{entry['word']} | {entry['reading']} | {entry['meaning']}\n"
        new_lines.append(line_out)

    try:
        with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
            for line in new_lines:
                f.write(line)
        print(f"Successfully added {len(entries)} entries to {os.path.basename(OUTPUT_FILE)}.")
    except Exception as e:
        print(f"Error writing to output file: {e}")
        return

    # 4. Backup to History
    try:
        with open(HISTORY_FILE, 'a', encoding='utf-8') as f:
            timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"\n--- Processed at {timestamp} ---\n")
            # Write original input content for record
            f.writelines(lines) 
    except Exception as e:
        print(f"Error writing to history file: {e}")

    # 5. Clear Input File
    try:
        with open(INPUT_FILE, 'w', encoding='utf-8') as f:
            f.write("") # Clear
        print("Input file cleared and ready for next batch.")
    except Exception as e:
        print(f"Error clearing input file: {e}")

def main():
    print(f"Listening for changes in: {INPUT_FILE}")
    print("KB (Ctrl+C to stop)")
    
    last_processed = 0
    
    while True:
        try:
            # Check file size
            try:
                current_size = os.path.getsize(INPUT_FILE)
            except FileNotFoundError:
                time.sleep(1)
                continue

            # If file has content (size > 0)
            if current_size > 0:
                # Small buffer time to ensure save is complete
                time.sleep(0.5) 
                parse_and_append()
            
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("\nStopping watcher...")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
