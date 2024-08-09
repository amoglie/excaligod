document.addEventListener('DOMContentLoaded', () => {
    const drawingList = document.getElementById('drawing-list');
    const newDrawingButton = document.getElementById('new-drawing');
    const excalidrawFrame = document.getElementById('excalidraw-frame');
    const versionElement = document.getElementById('version');
    let currentVersion = '1.0.0';
    let currentDrawingId = null;

    function updateVersion() {
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        currentVersion = `${major}.${minor}.${patch + 1}`;
        versionElement.textContent = `v${currentVersion}`;
    }

    function loadDrawingIntoExcalidraw(drawingData) {
        const excalidrawUrl = `https://excalidraw.com/#json=${encodeURIComponent(JSON.stringify(drawingData))}`;
        excalidrawFrame.src = excalidrawUrl;
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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(drawing => {
                if (drawing && drawing.data) {
                    currentDrawingId = drawingId;
                    const drawingData = typeof drawing.data === 'string' ? JSON.parse(drawing.data) : drawing.data;
                    loadDrawingIntoExcalidraw(drawingData);
                    updateVersion();
                } else {
                    console.error('Drawing data is missing');
                    loadDrawingIntoExcalidraw({ elements: [], appState: {} });
                }
            })
            .catch(error => {
                console.error('Error loading drawing:', error);
                loadDrawingIntoExcalidraw({ elements: [], appState: {} });
            });
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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(newDrawing => {
                currentDrawingId = newDrawing.id;
                loadDrawingIntoExcalidraw(newDrawingData);
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
                        currentDrawingId = null;
                        loadDrawingIntoExcalidraw({ elements: [], appState: {} });
                    }
                } else {
                    throw new Error('Failed to delete drawing');
                }
            })
            .catch(error => console.error('Error deleting drawing:', error));
        }
    }

    function updateDrawingInSupabase(drawingId, drawingData) {
        fetch(`/api/drawings/${drawingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: drawingData }),
        })
        .then(response => response.json())
        .then(() => {
            console.log('Drawing updated successfully');
            updateVersion();
        })
        .catch(error => console.error('Error updating drawing:', error));
    }

    window.addEventListener('message', function(event) {
        if (event.origin !== 'https://excalidraw.com') return;
        
        if (event.data && event.data.type === 'excalidraw') {
            const drawingData = event.data;
            if (currentDrawingId) {
                updateDrawingInSupabase(currentDrawingId, drawingData);
            }
        }
    }, false);

    // Inicializar la aplicación
    fetchDrawings();
    loadDrawingIntoExcalidraw({ elements: [], appState: {} });
});
