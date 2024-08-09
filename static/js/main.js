document.addEventListener('DOMContentLoaded', () => {
    const drawingList = document.getElementById('drawing-list');
    const newDrawingButton = document.getElementById('new-drawing');
    const excalidrawFrame = document.getElementById('excalidraw-frame');
    const versionElement = document.getElementById('version');
    let currentVersion = '0.1.0';

    function updateVersion() {
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        currentVersion = `${major}.${minor}.${patch + 1}`;
        versionElement.textContent = `v${currentVersion}`;
    }

    function loadExcalidrawFrame(drawingData = null) {
        const excalidrawUrl = 'https://excalidraw.com/';
        const url = drawingData ? `${excalidrawUrl}#json=${encodeURIComponent(JSON.stringify(drawingData))}` : excalidrawUrl;
        excalidrawFrame.src = url;
    }

    newDrawingButton.addEventListener('click', createNewDrawing);

    function fetchDrawings() {
        fetch('/api/drawings')
            .then(response => response.json())
            .then(drawings => {
                drawingList.innerHTML = '';
                drawings.forEach(drawing => {
                    const li = document.createElement('li');
                    li.textContent = drawing.name;
                    li.addEventListener('click', () => loadDrawing(drawing.id));
                    
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        editDrawingName(drawing.id, drawing.name);
                    });
                    
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        deleteDrawing(drawing.id);
                    });
                    
                    li.appendChild(editButton);
                    li.appendChild(deleteButton);
                    drawingList.appendChild(li);
                });
            })
            .catch(error => console.error('Error fetching drawings:', error));
    }

    function loadDrawing(drawingId) {
        fetch(`/api/drawings/${drawingId}`)
            .then(response => response.json())
            .then(drawing => {
                if (drawing.data) {
                    loadExcalidrawFrame(drawing.data);
                    updateVersion();
                } else {
                    console.error('Drawing data is missing');
                }
            })
            .catch(error => console.error('Error loading drawing:', error));
    }

    function createNewDrawing() {
        const name = prompt('Enter a name for the new drawing:');
        if (name) {
            loadExcalidrawFrame();
            updateVersion();
            // Aquí deberías implementar la lógica para guardar el nuevo dibujo en Supabase
            // cuando el usuario termine de dibujar y decida guardar
        }
    }

    function editDrawingName(drawingId, currentName) {
        const newName = prompt('Enter new name for the drawing:', currentName);
        if (newName && newName !== currentName) {
            fetch(`/api/drawings/${drawingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName }),
            })
            .then(response => response.json())
            .then(() => {
                fetchDrawings();
                updateVersion();
            })
            .catch(error => console.error('Error updating drawing name:', error));
        }
    }

    function deleteDrawing(drawingId) {
        if (confirm('Are you sure you want to delete this drawing?')) {
            fetch(`/api/drawings/${drawingId}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (response.ok) {
                    fetchDrawings();
                    updateVersion();
                    loadExcalidrawFrame(); // Cargar un nuevo lienzo vacío
                } else {
                    throw new Error('Failed to delete drawing');
                }
            })
            .catch(error => console.error('Error deleting drawing:', error));
        }
    }

    // Inicializar la aplicación
    fetchDrawings();
    loadExcalidrawFrame();
});
