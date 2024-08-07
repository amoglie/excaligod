document.addEventListener('DOMContentLoaded', () => {
    const drawingList = document.getElementById('drawing-list');
    const newDrawingButton = document.getElementById('new-drawing');
    
    // Inicializar Excalidraw
    const excalidrawContainer = document.getElementById('excalidraw-container');
    const excalidrawApp = ExcalidrawLib.createExcalidraw({
        container: excalidrawContainer
    });

    // Cargar dibujos existentes
    fetchDrawings();

    newDrawingButton.addEventListener('click', createNewDrawing);

    function fetchDrawings() {
        fetch('/api/drawings')
            .then(response => response.json())
            .then(drawings => {
                drawingList.innerHTML = '';
                drawings.forEach(drawing => {
                    const li = document.createElement('li');
                    li.textContent = drawing.name;
                    li.addEventListener('click', () => loadDrawing(drawing));
                    drawingList.appendChild(li);
                });
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

    function loadDrawing(drawing) {
        excalidrawApp.updateScene({ elements: drawing.data });
    }
});
