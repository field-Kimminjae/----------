import os
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "jlpt_data.txt")

def load_data():
    if not os.path.exists(DATA_FILE):
        print("Error: jlpt_data.txt not found.")
        return [], []

    basic_data = []
    advanced_data = []

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Loaded {len(lines)} raw lines.")

    for line in lines:
        parts = [p.strip() for p in line.split('|')]
        if len(parts) < 3:
            continue
        
        item = {
            'word': parts[0],
            'reading': parts[1],
            'meaning': parts[2]
        }

        if '≒' in item['meaning']:
            advanced_data.append(item)
        else:
            basic_data.append(item)
    
    return basic_data, advanced_data

def run_quiz():
    basic, advanced = load_data()
    print("-" * 40)
    print(f"Database Statistics")
    print("-" * 40)
    print(f"Basic Vocabulary:    {len(basic)}")
    print(f"Advanced Vocabulary: {len(advanced)}")
    print(f"Total Entries:       {len(basic) + len(advanced)}")
    print("-" * 40)

    if not basic:
        print("No data available.")
        return

    print("Sample Quiz Question (Basic):")
    q = random.choice(basic)
    print(f"Word:    {q['word']}")
    print(f"Reading: {q['reading']}")
    print(f"Meaning: (Hidden)")
    print(f"Answer:  {q['meaning']}")
    print("-" * 40)
    print("Verification Complete. Data is ready for the Web App.")

if __name__ == "__main__":
    run_quiz()
