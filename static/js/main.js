document.addEventListener('DOMContentLoaded', () => {
    const drawingList = document.getElementById('drawing-list');
    const newDrawingButton = document.getElementById('new-drawing');
    const excalidrawContainer = document.getElementById('excalidraw-container');
    let excalidrawApp;

    // Inicializar Excalidraw
    const initializeExcalidraw = async () => {
        const app = await Excalidraw.default({
            container: excalidrawContainer,
            UIOptions: {
                canvasActions: {
                    export: true,
                    saveAsImage: true,
                }
            }
        });
        return app;
    };

    // Cargar Excalidraw
    initializeExcalidraw().then(app => {
        excalidrawApp = app;
        // Cargar dibujos existentes una vez que Excalidraw esté listo
        fetchDrawings();
    }).catch(error => {
        console.error("Error initializing Excalidraw:", error);
    });

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
                    drawingList.appendChild(li);
                });
            })
            .catch(error => console.error('Error fetching drawings:', error));
    }

    function loadDrawing(drawingId) {
        fetch(`/api/drawings/${drawingId}`)
            .then(response => response.json())
            .then(drawing => {
                if (excalidrawApp && drawing.data) {
                    excalidrawApp.updateScene({ elements: drawing.data });
                } else {
                    console.error('Excalidraw not initialized or drawing data is missing');
                }
            })
            .catch(error => console.error('Error loading drawing:', error));
    }

    function createNewDrawing() {
        const name = prompt('Enter a name for the new drawing:');
        if (name && excalidrawApp) {
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
            })
            .catch(error => console.error('Error creating drawing:', error));
        } else if (!excalidrawApp) {
            console.error('Excalidraw not initialized');
        }
    }
});
