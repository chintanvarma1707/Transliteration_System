from flask import Flask, render_template, request, jsonify
import csv
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate
from deep_translator import GoogleTranslator
import os
import re

app = Flask(__name__)
translator_en_to_hi = GoogleTranslator(source='en', target='hi')

DATASET_PATH = os.path.join(os.path.dirname(__file__), 'dataset.csv')
transliteration_dict = {}

try:
    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                roman = row.get('roman')
                devanagari = row.get('devanagari')
                if roman and devanagari:
                    transliteration_dict[str(roman).strip().lower()] = str(devanagari).strip()
        print(f"Loaded {len(transliteration_dict)} words from dataset.")
    else:
        print("dataset.csv not found. Operating only with indic-transliteration.")
except Exception as e:
    print(f"Error loading dataset: {e}")

def get_transliteration(word):
    """
    Transliterates a single word from Roman to Devanagari.
    First checks the dataset, then falls back to indic-transliteration.
    """
    word_lower = word.lower()
    
    # 1. Dataset Lookup
    if word_lower in transliteration_dict:
        return transliteration_dict[word_lower]
    
    # 2. Algorithmic Fallback
    try:
        # Using ITRANS scheme as it closely matches typical typed Roman text
        result = transliterate(word_lower, sanscript.ITRANS, sanscript.DEVANAGARI)
        return result
    except Exception as e:
        print(f"Fallback error for {word}: {e}")
        return word # Return original on failure

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    roman_text = data['text']
    
    tokens = re.split(r'(\W+)', roman_text)
    devanagari_tokens = []
    for token in tokens:
        if token.strip() == '':
            devanagari_tokens.append(token)
        elif not re.match(r'[A-Za-z]+', token):
            devanagari_tokens.append(token)
        else:
            devanagari_tokens.append(get_transliteration(token))       
    devanagari_text = "".join(devanagari_tokens)
    
    translation_text = ""
    try:
        translation_text = translator_en_to_hi.translate(roman_text)
    except Exception as e:
        print(f"Translation error: {e}")
        translation_text = "Translation failed or unavailable."
    
    return jsonify({
        'devanagari': devanagari_text,
        'translation': translation_text,
        'original': roman_text
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
