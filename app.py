from flask import Flask, render_template, request, jsonify, send_from_directory
from supabase import create_client, Client
import os

app = Flask(__name__, static_folder='static')

# Configuración de Supabase
url: str = os.getenv("https://vayvurfxtipihydzthcb.supabase.co")
key: str = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheXZ1cmZ4dGlwaWh5ZHp0aGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNjI4NDMsImV4cCI6MjAzODYzODg0M30.cjS-uRpTKL-dtQbhDLMEz_xDUf6btI1FwWovQwMklrw")
supabase: Client = create_client(url, key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/drawings', methods=['GET', 'POST'])
def handle_drawings():
    if request.method == 'POST':
        data = request.json
        try:
            response = supabase.table("drawings").insert({
                "name": data['name'],
                "data": data['data']
            }).execute()
            return jsonify(response.data[0]), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        try:
            response = supabase.table("drawings").select("id", "name", "created_at").order("created_at", desc=True).execute()
            return jsonify(response.data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/drawings/<drawing_id>', methods=['GET'])
def get_drawing(drawing_id):
    try:
        response = supabase.table("drawings").select("*").eq("id", drawing_id).single().execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
