document.addEventListener('DOMContentLoaded', () => {
    const drawingList = document.getElementById('drawing-list');
    const newDrawingButton = document.getElementById('new-drawing');
    const excalidrawContainer = document.getElementById('excalidraw-container');
    const versionElement = document.getElementById('version');
    let currentVersion = '0.6.0';
    let currentDrawingId = null;
    let excalidrawApp = null;

    function updateVersion() {
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        currentVersion = `${major}.${minor}.${patch + 1}`;
        versionElement.textContent = `v${currentVersion}`;
    }

    async function initExcalidraw() {
        const ExcalidrawModule = window.Excalidraw;
        excalidrawApp = await ExcalidrawModule.default({
            container: excalidrawContainer,
            onChange: (elements, appState) => {
                if (currentDrawingId) {
                    debounce(() => updateDrawingInSupabase(currentDrawingId, { elements, appState }), 1000)();
                }
            },
        });
    }

    function loadDrawingIntoExcalidraw(drawingData) {
        if (excalidrawApp) {
            excalidrawApp.updateScene(drawingData);
        }
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
                    loadDrawingIntoExcalidraw(JSON.parse(drawing.data));
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
                body: JSON.stringify({ name: name, data: JSON.stringify(newDrawingData) }),
            })
            .then(response => response.json())
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
            body: JSON.stringify({ data: JSON.stringify(drawingData) }),
        })
        .then(response => response.json())
        .then(() => {
            console.log('Drawing updated successfully');
            updateVersion();
        })
        .catch(error => console.error('Error updating drawing:', error));
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Inicializar la aplicación
    initExcalidraw().then(() => {
        fetchDrawings();
        loadDrawingIntoExcalidraw({ elements: [], appState: {} });
    });
});
