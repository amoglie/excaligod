document.addEventListener('DOMContentLoaded', () => {
    const drawingList = document.getElementById('drawing-list');
    const newDrawingButton = document.getElementById('new-drawing');
    const excalidrawContainer = document.getElementById('excalidraw-container');
    let excalidrawApp;

    // Inicializar Excalidraw
    excalidrawApp = Excalidraw.default({
        container: excalidrawContainer,
        UIOptions: { canvasActions: { export: false, saveAsImage: false } }
    });

    // Cargar dibujos existentes
    fetchDrawings();

function fetchDrawings() {
    fetch('/api/drawings')
        .then(response => response.json())
        .then(drawings => {
            drawingList.innerHTML = '';
            drawings.forEach(drawing => {
                const li = document.createElement('li');
                li.textContent = drawing.name;
                li.addEventListener('click', () => loadDrawing(drawing.id));
                drawingList.appendChild(li);
            });
        });
}

function loadDrawing(drawingId) {
    fetch(`/api/drawings/${drawingId}`)
        .then(response => response.json())
        .then(drawing => {
            excalidrawApp.updateScene({ elements: drawing.data });
        });
}

function createNewDrawing() {
    const name = prompt('Enter a name for the new drawing:');
    if (name) {
        const drawingData = excalidrawApp.getSceneElements();
        fetch('/api/drawings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, data: drawingData }),
        })
        .then(response => response.json())
        .then(() => {
            fetchDrawings();
        });
    }
}
