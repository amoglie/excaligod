from flask import Flask, render_template, request, jsonify, send_from_directory
from supabase import create_client, Client
import os
import json

app = Flask(__name__, static_folder='static')

# Configuración de Supabase
url: str = os.getenv("SUPABASE_URL", "https://vayvurfxtipihydzthcb.supabase.co")
key: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZheXZ1cmZ4dGlwaWh5ZHp0aGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNjI4NDMsImV4cCI6MjAzODYzODg0M30.cjS-uRpTKL-dtQbhDLMEz_xDUf6btI1FwWovQwMklrw")

try:
    supabase: Client = create_client(url, key)
    print("Conexión a Supabase establecida correctamente.")
except Exception as e:
    print(f"Error al crear el cliente de Supabase: {e}")
    supabase = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/drawings', methods=['GET', 'POST'])
def handle_drawings():
    if not supabase:
        return jsonify({"error": "Supabase no está configurado correctamente"}), 500
    
    if request.method == 'POST':
        data = request.json
        try:
            # Asegúrate de que 'data' es una cadena JSON válida
            if isinstance(data.get('data'), dict):
                data['data'] = json.dumps(data['data'])
            
            response = supabase.table("drawings").insert(data).execute()
            return jsonify(response.data[0]), 201
        except json.JSONDecodeError as e:
            print(f"Error al decodificar JSON: {e}")
            return jsonify({"error": "Datos de dibujo inválidos"}), 400
        except Exception as e:
            print(f"Error al crear el dibujo: {e}")
            return jsonify({"error": str(e)}), 500
    else:
        try:
            response = supabase.table("drawings").select("id,name,created_at").order('created_at', desc=True).execute()
            return jsonify(response.data)
        except Exception as e:
            print(f"Error al obtener los dibujos: {e}")
            return jsonify({"error": str(e)}), 500

@app.route('/api/drawings/<drawing_id>', methods=['GET', 'PATCH', 'DELETE'])
def handle_drawing(drawing_id):
    if not supabase:
        return jsonify({"error": "Supabase no está configurado correctamente"}), 500

    try:
        if request.method == 'GET':
            response = supabase.table("drawings").select("*").filter("id", "eq", drawing_id).execute()
            if response.data:
                return jsonify(response.data[0])
            else:
                return jsonify({"error": "Drawing not found"}), 404
        
        elif request.method == 'PATCH':
            data = request.json
            if 'data' in data and isinstance(data['data'], dict):
                data['data'] = json.dumps(data['data'])
            response = supabase.table("drawings").update(data).filter("id", "eq", drawing_id).execute()
            if response.data:
                return jsonify(response.data[0])
            else:
                return jsonify({"error": "Drawing not found"}), 404
        
        elif request.method == 'DELETE':
            response = supabase.table("drawings").delete().filter("id", "eq", drawing_id).execute()
            if response.data:
                return jsonify({"message": "Drawing deleted successfully"})
            else:
                return jsonify({"error": "Drawing not found"}), 404
        
    except json.JSONDecodeError as e:
        print(f"Error al decodificar JSON: {e}")
        return jsonify({"error": "Datos de dibujo inválidos"}), 400
    except Exception as e:
        print(f"Error al manejar el dibujo {drawing_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "supabase_connected": supabase is not None}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
