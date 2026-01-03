import re
import os

# Path to script.js
script_path = r"c:\Users\user\OneDrive\데스크탑\Desktop\토익 공부 웹사이트\script.js"
output_path = r"c:\Users\user\OneDrive\데스크탑\Desktop\토익 공부 웹사이트\[TOEIC_Vocabulary].txt"

def extract_data():
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the VOCAB_QUIZ_DATA array
    # Looking for: const VOCAB_QUIZ_DATA = [ ... ];
    match = re.search(r'const VOCAB_QUIZ_DATA = \[(.*?)\];', content, re.DOTALL)
    if not match:
        print("Could not find VOCAB_QUIZ_DATA")
        return

    data_block = match.group(1)
    
    # Parse each object { key: "value", ... }
    # We will use regex to find objects and extract fields
    # Pattern: { sentence: "(.*?)", word: "(.*?)", answer: "(.*?)", explanation: "(.*?)" }
    # Note: explanation might contain parens, so be careful with greedy matching if simplistic.
    # But the format seems consistent in the file.
    
    items = []
    # simple split by '},' might work if formatting is consistent
    lines = data_block.split('},')
    
    for line in lines:
        if not line.strip(): continue
        
        # simple extraction
        s_match = re.search(r'sentence:\s*"(.*?)"', line)
        w_match = re.search(r'word:\s*"(.*?)"', line)
        a_match = re.search(r'answer:\s*"(.*?)"', line)
        e_match = re.search(r'explanation:\s*"(.*?)"', line)
        
        if s_match and w_match and a_match and e_match:
            sentence = s_match.group(1)
            word = w_match.group(1)
            answer = a_match.group(1)
            explanation = e_match.group(1)
            
            # Format: Word | Answer | Sentence | Explanation
            items.append(f"{word} | {answer} | {sentence} | {explanation}")
            
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(items))
        
    print(f"Successfully migrated {len(items)} items to {output_path}")

if __name__ == '__main__':
    extract_data()
