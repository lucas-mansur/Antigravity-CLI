import os
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Definir namespaces para o Atom XML
NAMESPACES = {'atom': 'http://www.w3.org/2005/Atom'}

def fetch_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    releases = []
    
    for entry in root.findall('atom:entry', NAMESPACES):
        title_el = entry.find('atom:title', NAMESPACES)
        updated_el = entry.find('atom:updated', NAMESPACES)
        link_el = entry.find('atom:link[@rel="alternate"]', NAMESPACES)
        if link_el is None:
            link_el = entry.find('atom:link', NAMESPACES)
            
        content_el = entry.find('atom:content', NAMESPACES)
        id_el = entry.find('atom:id', NAMESPACES)
        
        releases.append({
            'title': title_el.text if title_el is not None else 'Sem título',
            'updated': updated_el.text if updated_el is not None else '',
            'link': link_el.attrib.get('href', '') if link_el is not None else '',
            'content': content_el.text if content_el is not None else '',
            'id': id_el.text if id_el is not None else ''
        })
    return releases

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        releases = fetch_release_notes()
        return jsonify({'status': 'success', 'data': releases})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    # Usar porta 5000 por padrão
    app.run(debug=True, host='127.0.0.1', port=5000)
