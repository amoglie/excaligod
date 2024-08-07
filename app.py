from flask import Flask, render_template, request, jsonify
from supabase import create_client, Client
import os

app = Flask(__name__)

# Configuración de Supabase
url: str = os.getenv("SUPABASE_URL", "https://vayvurfxtipihydzthcb.supabase.co")
key: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheXZ1cmZ4dGlwaWh5ZHp0aGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNjI4NDMsImV4cCI6MjAzODYzODg0M30.cjS-uRpTKL-dtQbhDLMEz_xDUf6btI1FwWovQwMklrw")
supabase: Client = create_client(url, key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/drawings', methods=['GET', 'POST'])
def handle_drawings():
    if request.method == 'POST':
        data = request.json
        response = supabase.table("drawings").insert(data).execute()
        return jsonify(response.data)
    else:
        response = supabase.table("drawings").select("*").execute()
        return jsonify(response.data)

if __name__ == '__main__':
    # Esta configuración es para desarrollo local
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
else:
    # Esta configuración es para producción (Gunicorn)
    app.run()
