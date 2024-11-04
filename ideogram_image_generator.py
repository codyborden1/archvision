import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, send_from_directory
import requests
import logging

load_dotenv()  # Load environment variables

app = Flask(__name__, static_folder='static', static_url_path='/static')

logging.basicConfig(level=logging.INFO)

IDEOGRAM_API_KEY = os.getenv('IDEOGRAM_API_KEY')
IDEOGRAM_API_URL = 'https://api.ideogram.ai/generate'

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    app.logger.debug(f"Attempting to serve: {path}")
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        app.logger.debug(f"Serving static file: {path}")
        return send_from_directory(app.static_folder, path)
    else:
        app.logger.debug(f"Serving index.html for path: {path}")
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory(app.static_folder, 'dashboard.html')

@app.route('/my-renderings')
def my_renderings():
    return send_from_directory(app.static_folder, 'my-renderings.html')

@app.route('/favorites')
def favorites():
    return send_from_directory(app.static_folder, 'favorites.html')

@app.route('/generation-form')
def generation_form():
    return send_from_directory(app.static_folder, 'generation-form.html')

@app.route('/generate', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get('prompt')
    aspect_ratio = data.get('aspectRatio')

    headers = {
        'Api-Key': IDEOGRAM_API_KEY,
        'Content-Type': 'application/json'
    }

    payload = {
        "image_request": {
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "model": "V_2",
            "magic_prompt_option": "AUTO"
        }
    }

    try:
        logging.info("Sending request to Ideogram API")
        response = requests.post(IDEOGRAM_API_URL, headers=headers, json=payload)
        logging.info(f"Received response with status code: {response.status_code}")
        
        response.raise_for_status()

        # Try to parse JSON, but handle cases where it's not JSON
        try:
            result = response.json()
            if result.get('data') and len(result['data']) > 0:
                return jsonify({"url": result['data'][0]['url']})
            else:
                logging.error("No image data received")
                return jsonify({"error": "No image data received"}), 500
        except ValueError:
            # Response is not JSON
            if response.content:
                # If there's content, it might be the image directly
                return response.content, 200, {'Content-Type': 'image/jpeg'}
            else:
                logging.error("Received non-JSON response with no content")
                return jsonify({"error": "Unexpected response format", "response": response.text}), 500

    except requests.exceptions.RequestException as e:
        logging.error("API request failed")
        return jsonify({"error": "An error occurred"}), 500
    except Exception as e:
        logging.error("An unexpected error occurred")
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)  # Removed debug=True for security
