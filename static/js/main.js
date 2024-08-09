document.addEventListener('DOMContentLoaded', () => {
    const drawingList = document.getElementById('drawing-list');
    const newDrawingButton = document.getElementById('new-drawing');
    const excalidrawFrame = document.getElementById('excalidraw-frame');
    const versionElement = document.getElementById('version');
    let currentVersion = '0.1.0';
    let currentDrawingId = null;

    function updateVersion() {
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        currentVersion = `${major}.${minor}.${patch + 1}`;
        versionElement.textContent = `v${currentVersion}`;
    }

    function loadExcalidrawFrame(drawingData = null, drawingId = null) {
        const excalidrawUrl = 'https://excalidraw.com/';
        const url = drawingData ? `${excalidrawUrl}#json=${encodeURIComponent(JSON.stringify(drawingData))}` : excalidrawUrl;
        excalidrawFrame.src = url;
        currentDrawingId = drawingId;
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
                    loadExcalidrawFrame(drawing.data, drawingId);
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
            const newDrawingData = { elements: [], appState: {} };
            
            fetch('/api/drawings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name, data: newDrawingData }),
            })
            .then(response => response.json())
            .then(newDrawing => {
                loadExcalidrawFrame(newDrawingData, newDrawing.id);
                updateVersion();
                fetchDrawings();
            })
            .catch(error => console.error('Error creating new drawing:', error));
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
                    if (currentDrawingId === drawingId) {
                        loadExcalidrawFrame();
                        currentDrawingId = null;
                    }
                } else {
                    throw new Error('Failed to delete drawing');
                }
            })
            .catch(error => console.error('Error deleting drawing:', error));
        }
    }

    function saveCurrentDrawing() {
        if (excalidrawFrame.contentWindow && currentDrawingId) {
            excalidrawFrame.contentWindow.postMessage({ type: 'get-scene' }, '*');
        }
    }

    function updateDrawingInSupabase(drawingId, updatedData) {
        fetch(`/api/drawings/${drawingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: updatedData }),
        })
        .then(response => response.json())
        .then(() => {
            console.log('Drawing updated successfully');
            updateVersion();
        })
        .catch(error => console.error('Error updating drawing:', error));
    }

    window.addEventListener('message', (event) => {
        if (event.data.type === 'scene-update') {
            const updatedDrawingData = event.data.elements;
            if (currentDrawingId) {
                updateDrawingInSupabase(currentDrawingId, updatedDrawingData);
            } else {
                console.error('No current drawing ID to update');
            }
        }
    });

    fetchDrawings();
    loadExcalidrawFrame();

    setInterval(saveCurrentDrawing, 30000); // Guardar cada 30 segundos
});
