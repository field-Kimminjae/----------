import re
import os

INPUT_FILE = r"c:\토익 공부 웹사이트\jlpt-quiz\raw_input.txt"
OUTPUT_FILE = r"c:\토익 공부 웹사이트\jlpt-quiz\jlpt_data.txt"

def parse_and_append():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    entries = []
    current_entry = None

    # Regex to match: Word (Reading) [Meaning] OR Word [Meaning]
    # Group 1: Word
    # Group 2: Reading (Optional)
    # Group 3: Meaning (Content inside [])
    item_pattern = re.compile(r'^(.+?)(?:\s*\((.+?)\))?\s*\[(.+?)\]$')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Skip headers / comments
        if "페이지" in line or line.startswith("(") and "행)" in line:
             print(f"Skipping header/comment: {line}")
             continue
        if line.startswith("(") and ")" in line and not "[" in line:
             print(f"Skipping comment: {line}")
             continue


        # Check for Synonym line
        if line.startswith('≒'):
            if current_entry:
                # Append to the meaning of the current entry
                # Remove '≒' and trim
                synonym_content = line
                current_entry['meaning'] += f" ({synonym_content})"
            else:
                print(f"Warning: Orphaned synonym line: {line}")
            continue

        # Check for New Item line
        match = item_pattern.match(line)
        if match:
            # Save previous entry if exists
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
            # If it doesn't match match pattern and not synonym/header, log it
            print(f"Skipping unmatched line: {line}")

    # Append the last entry
    if current_entry:
        entries.append(current_entry)

    # Write to output file
    print(f"Found {len(entries)} new entries.")
    
    with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
        # f.write("\n") # Ensure newline start?
        # Actually, let's just write. logic should verify if last line has newline.
        # But 'a' mode just appends.
        for entry in entries:
            # Format: Word | Reading | Meaning
            line_out = f"{entry['word']} | {entry['reading']} | {entry['meaning']}\n"
            f.write(line_out)
            print(f"Added: {line_out.strip()}")

if __name__ == "__main__":
    parse_and_append()
