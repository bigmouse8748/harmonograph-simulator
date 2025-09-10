// Main Application Entry Point
import { SuspendedBoard } from './physics/SuspendedBoard.js';
import { CoordinateSystem } from './physics/CoordinateSystem.js';

class HarmographApp {
    constructor() {
        this.board = null;
        this.coordinateSystem = new CoordinateSystem();
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        this.trail = [];
        this.isPenDown = true;
        
        // Canvas contexts
        this.initCtx = null;
        this.physics3dCtx = null;
        this.drawingCtx = null;
        
        // View states
        this.initViewState = {
            scale: 100, // pixels per meter
            offset: { x: 150, y: 150 }, // canvas center
            dragState: null
        };
        
        this.physics3dViewState = {
            rotationX: 30,
            rotationY: 45,
            zoom: 1,
            scale: 80
        };
        
        this.drawingViewState = {
            scale: 400, // zoom level for paper area
            offset: { x: 400, y: 300 }, // canvas center
            panState: null
        };
        
        this.initializeApp();
    }
    
    async initializeApp() {
        try {
            await this.initializeCanvases();
            this.initializeBoard();
            this.setupEventListeners();
            this.updateUI();
            this.render();
            console.log('Harmonograph app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.updateStatus('System: Error - ' + error.message);
        }
    }
    
    initializeCanvases() {
        // Initialize canvas contexts
        const initCanvas = document.getElementById('initCanvas');
        const physics3dCanvas = document.getElementById('physics3dCanvas');
        const drawingCanvas = document.getElementById('drawingCanvas');
        
        if (!initCanvas || !physics3dCanvas || !drawingCanvas) {
            throw new Error('Canvas elements not found');
        }
        
        this.initCtx = initCanvas.getContext('2d');
        this.physics3dCtx = physics3dCanvas.getContext('2d');
        this.drawingCtx = drawingCanvas.getContext('2d');
        
        // Set canvas sizes to match their display size
        this.resizeCanvases();
    }
    
    resizeCanvases() {
        const canvases = [
            { element: document.getElementById('initCanvas'), ctx: this.initCtx },
            { element: document.getElementById('physics3dCanvas'), ctx: this.physics3dCtx },
            { element: document.getElementById('drawingCanvas'), ctx: this.drawingCtx }
        ];
        
        canvases.forEach(({ element, ctx }) => {
            const rect = element.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            element.width = rect.width * dpr;
            element.height = rect.height * dpr;
            
            ctx.scale(dpr, dpr);
            element.style.width = rect.width + 'px';
            element.style.height = rect.height + 'px';
        });
    }
    
    initializeBoard() {
        // Create suspended board with default parameters
        this.board = new SuspendedBoard({
            width: 2.0,           // 2m x 1.5m board
            height: 1.5,
            mass: 50,             // 50kg board
            ropeLength: 2.0,      // 2m rope length
            suspensionWidth: 2.2, // suspension points spacing
            suspensionHeight: 1.7,
            position: { x: 0, y: 0, z: -2.0 }, // start 2m below suspension
            velocity: { x: 0, y: 0, z: 0 },
            rotation: { roll: 0, pitch: 0, yaw: 0 },
            angularVelocity: { roll: 0, pitch: 0, yaw: 0 }
        });
        
        // Paper configuration (20cm x 15cm paper on board)
        this.paperConfig = {
            width: 0.2,   // 20cm
            height: 0.15, // 15cm
            offsetX: 0,   // centered on board
            offsetY: 0
        };
        
        // Fixed pen position (at origin)
        this.penPosition = { x: 0, y: 0, z: 0 };
    }
    
    setupEventListeners() {
        // Header controls
        document.getElementById('boardMass').addEventListener('input', this.handleBoardMassChange.bind(this));
        document.getElementById('ropeLength').addEventListener('input', this.handleRopeLengthChange.bind(this));
        document.getElementById('penToggle').addEventListener('click', this.handlePenToggle.bind(this));
        document.getElementById('startSim').addEventListener('click', this.handleStartSimulation.bind(this));
        document.getElementById('resetSim').addEventListener('click', this.handleResetSimulation.bind(this));
        document.getElementById('clearTrail').addEventListener('click', this.handleClearTrail.bind(this));
        
        // Initialization window mouse events
        const initCanvas = document.getElementById('initCanvas');
        initCanvas.addEventListener('mousedown', this.handleInitMouseDown.bind(this));
        initCanvas.addEventListener('mousemove', this.handleInitMouseMove.bind(this));
        initCanvas.addEventListener('mouseup', this.handleInitMouseUp.bind(this));
        
        // 3D view controls
        document.getElementById('view3dRotX').addEventListener('input', this.handle3DViewChange.bind(this));
        document.getElementById('view3dRotY').addEventListener('input', this.handle3DViewChange.bind(this));
        document.getElementById('view3dZoom').addEventListener('input', this.handle3DViewChange.bind(this));
        document.getElementById('viewPreset').addEventListener('change', this.handle3DViewPreset.bind(this));
        
        // Drawing window controls
        document.getElementById('zoomFitPaper').addEventListener('click', this.handleZoomFitPaper.bind(this));
        document.getElementById('zoomFitBoard').addEventListener('click', this.handleZoomFitBoard.bind(this));
        
        // Drawing canvas mouse events for pan
        const drawingCanvas = document.getElementById('drawingCanvas');
        drawingCanvas.addEventListener('mousedown', this.handleDrawingMouseDown.bind(this));
        drawingCanvas.addEventListener('mousemove', this.handleDrawingMouseMove.bind(this));
        drawingCanvas.addEventListener('mouseup', this.handleDrawingMouseUp.bind(this));
        drawingCanvas.addEventListener('wheel', this.handleDrawingWheel.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.resizeCanvases.bind(this));
    }
    
    // Event Handlers
    handleBoardMassChange(event) {
        const mass = parseFloat(event.target.value);
        this.board.mass = mass;
        document.getElementById('boardMassValue').textContent = mass;
        this.updateUI();
    }
    
    handleRopeLengthChange(event) {
        const length = parseFloat(event.target.value);
        this.board.ropeLength = length;
        document.getElementById('ropeLengthValue').textContent = length.toFixed(1);
        this.board.resetToEquilibrium();
        this.updateUI();
    }
    
    handlePenToggle(event) {
        this.isPenDown = !this.isPenDown;
        const button = event.target;
        if (this.isPenDown) {
            button.textContent = 'Pen Down';
            button.className = 'pen-down';
        } else {
            button.textContent = 'Pen Up';
            button.className = 'pen-up';
        }
    }
    
    handleStartSimulation() {
        if (this.isRunning) {
            this.stopSimulation();
        } else {
            this.startSimulation();
        }
    }
    
    handleResetSimulation() {
        this.stopSimulation();
        this.board.resetToEquilibrium();
        this.trail = [];
        this.updateUI();
        this.render();
    }
    
    handleClearTrail() {
        this.trail = [];
        this.render();
    }
    
    // Initialization window interactions
    handleInitMouseDown(event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if clicking on board representation
        const boardScreenPos = this.worldToInitScreen(this.board.position);
        const distance = Math.sqrt(
            Math.pow(x - boardScreenPos.x, 2) + 
            Math.pow(y - boardScreenPos.y, 2)
        );
        
        if (distance < 30) { // 30px hit radius
            this.initViewState.dragState = {
                startMouse: { x, y },
                startBoard: { ...this.board.position }
            };
            event.target.style.cursor = 'grabbing';
        }
    }
    
    handleInitMouseMove(event) {
        if (!this.initViewState.dragState) return;
        
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const dx = x - this.initViewState.dragState.startMouse.x;
        const dy = y - this.initViewState.dragState.startMouse.y;
        
        // Convert screen movement to world coordinates
        const worldDx = dx / this.initViewState.scale;
        const worldDy = -dy / this.initViewState.scale; // flip Y
        
        this.board.position.x = this.initViewState.dragState.startBoard.x + worldDx;
        this.board.position.y = this.initViewState.dragState.startBoard.y + worldDy;
        
        this.updateUI();
        this.render();
    }
    
    handleInitMouseUp(event) {
        this.initViewState.dragState = null;
        event.target.style.cursor = 'crosshair';
    }
    
    // 3D view controls
    handle3DViewChange() {
        this.physics3dViewState.rotationX = parseFloat(document.getElementById('view3dRotX').value);
        this.physics3dViewState.rotationY = parseFloat(document.getElementById('view3dRotY').value);
        this.physics3dViewState.zoom = parseFloat(document.getElementById('view3dZoom').value);
        this.render();
    }
    
    handle3DViewPreset(event) {
        const preset = event.target.value;
        switch (preset) {
            case 'isometric':
                this.physics3dViewState.rotationX = 30;
                this.physics3dViewState.rotationY = 45;
                break;
            case 'front':
                this.physics3dViewState.rotationX = 0;
                this.physics3dViewState.rotationY = 0;
                break;
            case 'side':
                this.physics3dViewState.rotationX = 0;
                this.physics3dViewState.rotationY = 90;
                break;
            case 'top':
                this.physics3dViewState.rotationX = 90;
                this.physics3dViewState.rotationY = 0;
                break;
        }
        
        // Update sliders
        document.getElementById('view3dRotX').value = this.physics3dViewState.rotationX;
        document.getElementById('view3dRotY').value = this.physics3dViewState.rotationY;
        
        this.render();
    }
    
    // Drawing window interactions
    handleZoomFitPaper() {
        // Fit paper area in drawing window
        const canvas = document.getElementById('drawingCanvas');
        const paperWorldSize = {
            width: this.paperConfig.width,
            height: this.paperConfig.height
        };
        
        const scaleX = (canvas.width * 0.8) / paperWorldSize.width;
        const scaleY = (canvas.height * 0.8) / paperWorldSize.height;
        
        this.drawingViewState.scale = Math.min(scaleX, scaleY);
        this.drawingViewState.offset = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        
        this.updateZoomDisplay();
        this.render();
    }
    
    handleZoomFitBoard() {
        // Fit board area in drawing window
        const canvas = document.getElementById('drawingCanvas');
        const boardWorldSize = {
            width: this.board.width,
            height: this.board.height
        };
        
        const scaleX = (canvas.width * 0.8) / boardWorldSize.width;
        const scaleY = (canvas.height * 0.8) / boardWorldSize.height;
        
        this.drawingViewState.scale = Math.min(scaleX, scaleY);
        this.drawingViewState.offset = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        
        this.updateZoomDisplay();
        this.render();
    }
    
    handleDrawingMouseDown(event) {
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.drawingViewState.panState = {
            startMouse: { x, y },
            startOffset: { ...this.drawingViewState.offset }
        };
        
        event.target.style.cursor = 'grabbing';
    }
    
    handleDrawingMouseMove(event) {
        if (!this.drawingViewState.panState) return;
        
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const dx = x - this.drawingViewState.panState.startMouse.x;
        const dy = y - this.drawingViewState.panState.startMouse.y;
        
        this.drawingViewState.offset = {
            x: this.drawingViewState.panState.startOffset.x + dx,
            y: this.drawingViewState.panState.startOffset.y + dy
        };
        
        this.render();
    }
    
    handleDrawingMouseUp(event) {
        this.drawingViewState.panState = null;
        event.target.style.cursor = 'grab';
    }
    
    handleDrawingWheel(event) {
        event.preventDefault();
        
        const rect = event.target.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const oldScale = this.drawingViewState.scale;
        const newScale = oldScale * zoomFactor;
        
        // Zoom toward mouse position
        this.drawingViewState.offset.x = mouseX - (mouseX - this.drawingViewState.offset.x) * (newScale / oldScale);
        this.drawingViewState.offset.y = mouseY - (mouseY - this.drawingViewState.offset.y) * (newScale / oldScale);
        this.drawingViewState.scale = newScale;
        
        this.updateZoomDisplay();
        this.render();
    }
    
    // Coordinate transformations
    worldToInitScreen(worldPos) {
        return {
            x: this.initViewState.offset.x + worldPos.x * this.initViewState.scale,
            y: this.initViewState.offset.y - worldPos.y * this.initViewState.scale
        };
    }
    
    worldToDrawingScreen(worldPos) {
        return {
            x: this.drawingViewState.offset.x + worldPos.x * this.drawingViewState.scale,
            y: this.drawingViewState.offset.y - worldPos.y * this.drawingViewState.scale
        };
    }
    
    // Simulation control
    startSimulation() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.simulationLoop.bind(this));
        
        document.getElementById('startSim').textContent = 'Stop Simulation';
        document.getElementById('startSim').className = 'btn-secondary';
        this.updateStatus('System: Running');
    }
    
    stopSimulation() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        document.getElementById('startSim').textContent = 'Start Simulation';
        document.getElementById('startSim').className = 'btn-primary';
        this.updateStatus('System: Stopped');
    }
    
    simulationLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Update physics
        this.board.update(Math.min(deltaTime, 1/30)); // Cap at 30 FPS for stability
        
        // Record trail if pen is down and on paper
        if (this.isPenDown) {
            const penOnPaper = this.isPenOnPaper();
            if (penOnPaper) {
                const paperPos = this.worldToPaperCoordinates(this.penPosition);
                this.trail.push({ ...paperPos, time: currentTime });
            }
        }
        
        // Update UI
        this.updateUI();
        this.render();
        
        // Continue animation loop
        this.animationId = requestAnimationFrame(this.simulationLoop.bind(this));
    }
    
    isPenOnPaper() {
        const paperBounds = this.getPaperBoundsInWorld();
        const pen = this.penPosition;
        
        return pen.x >= paperBounds.left && pen.x <= paperBounds.right &&
               pen.y >= paperBounds.bottom && pen.y <= paperBounds.top &&
               Math.abs(pen.z - this.board.position.z) < 0.01; // Within 1cm of board surface
    }
    
    getPaperBoundsInWorld() {
        const boardPos = this.board.position;
        const paperHalfWidth = this.paperConfig.width / 2;
        const paperHalfHeight = this.paperConfig.height / 2;
        
        return {
            left: boardPos.x + this.paperConfig.offsetX - paperHalfWidth,
            right: boardPos.x + this.paperConfig.offsetX + paperHalfWidth,
            bottom: boardPos.y + this.paperConfig.offsetY - paperHalfHeight,
            top: boardPos.y + this.paperConfig.offsetY + paperHalfHeight
        };
    }
    
    worldToPaperCoordinates(worldPos) {
        const paperBounds = this.getPaperBoundsInWorld();
        return {
            x: worldPos.x - paperBounds.left,
            y: worldPos.y - paperBounds.bottom
        };
    }
    
    // UI Updates
    updateUI() {
        // Update board position info
        const pos = this.board.position;
        document.getElementById('boardPosInfo').textContent = 
            `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`;
        
        // Update board rotation info
        const rot = this.board.rotation;
        document.getElementById('boardRotInfo').textContent = 
            `(${(rot.roll * 180/Math.PI).toFixed(1)}°, ${(rot.pitch * 180/Math.PI).toFixed(1)}°, ${(rot.yaw * 180/Math.PI).toFixed(1)}°)`;
        
        // Update paper position (relative to board)
        const paperPos = this.paperConfig;
        document.getElementById('paperPosInfo').textContent = 
            `(${paperPos.offsetX.toFixed(2)}, ${paperPos.offsetY.toFixed(2)})`;
        
        // Update pen position
        const pen = this.penPosition;
        document.getElementById('penPosInfo').textContent = 
            `(${pen.x.toFixed(2)}, ${pen.y.toFixed(2)})`;
        
        // Update drawing status
        const drawing = this.isPenDown && this.isPenOnPaper();
        const statusElement = document.getElementById('drawingStatus');
        if (drawing) {
            statusElement.textContent = 'Drawing';
            statusElement.className = 'status-drawing';
        } else if (this.isPenDown) {
            statusElement.textContent = 'Pen Down';
            statusElement.className = 'status-on';
        } else {
            statusElement.textContent = 'Pen Up';
            statusElement.className = 'status-off';
        }
        
        // Update simulation time
        document.getElementById('simTime').textContent = `${this.board.time.toFixed(1)}s`;
        
        // Update total energy
        const energy = this.board.getTotalEnergy();
        document.getElementById('totalEnergy').textContent = `${energy.toFixed(1)} J`;
        
        // Update trail points count
        document.getElementById('trailPoints').textContent = this.trail.length;
    }
    
    updateZoomDisplay() {
        const zoomPercent = Math.round((this.drawingViewState.scale / 400) * 100);
        document.getElementById('zoomLevel').textContent = `${zoomPercent}%`;
    }
    
    updateStatus(status) {
        document.getElementById('systemStatus').textContent = status;
    }
    
    // Rendering
    render() {
        this.renderInitWindow();
        this.render3DPhysics();
        this.renderDrawingArea();
    }
    
    renderInitWindow() {
        const ctx = this.initCtx;
        const canvas = ctx.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        
        // Draw suspension points
        ctx.fillStyle = '#374151';
        const suspensionPoints = this.board.suspensionPoints;
        suspensionPoints.forEach(point => {
            const screenPos = this.worldToInitScreen(point);
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Draw board (as rectangle)
        const boardScreenPos = this.worldToInitScreen(this.board.position);
        const boardScreenWidth = this.board.width * this.initViewState.scale;
        const boardScreenHeight = this.board.height * this.initViewState.scale;
        
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            boardScreenPos.x - boardScreenWidth/2,
            boardScreenPos.y - boardScreenHeight/2,
            boardScreenWidth,
            boardScreenHeight
        );
        
        // Draw paper on board
        const paperScreenWidth = this.paperConfig.width * this.initViewState.scale;
        const paperScreenHeight = this.paperConfig.height * this.initViewState.scale;
        
        ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
        ctx.fillRect(
            boardScreenPos.x - paperScreenWidth/2,
            boardScreenPos.y - paperScreenHeight/2,
            paperScreenWidth,
            paperScreenHeight
        );
        
        // Draw pen (fixed at origin)
        const penScreenPos = this.worldToInitScreen(this.penPosition);
        ctx.fillStyle = this.isPenDown ? '#dc2626' : '#d97706';
        ctx.beginPath();
        ctx.arc(penScreenPos.x, penScreenPos.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw ropes
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        suspensionPoints.forEach(point => {
            const suspensionScreen = this.worldToInitScreen(point);
            ctx.beginPath();
            ctx.moveTo(suspensionScreen.x, suspensionScreen.y);
            ctx.lineTo(boardScreenPos.x, boardScreenPos.y);
            ctx.stroke();
        });
    }
    
    render3DPhysics() {
        const ctx = this.physics3dCtx;
        const canvas = ctx.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        
        // Simple 3D projection (isometric-style)
        const centerX = canvas.clientWidth / 2;
        const centerY = canvas.clientHeight / 2;
        
        // This is a simplified 3D rendering - in a full implementation,
        // you'd want proper 3D transformation matrices
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.physics3dViewState.zoom, this.physics3dViewState.zoom);
        
        // Draw suspension frame (simplified)
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.strokeRect(-100, -120, 200, 40);
        
        // Draw board (simplified 3D representation)
        const boardX = this.board.position.x * this.physics3dViewState.scale;
        const boardY = this.board.position.y * this.physics3dViewState.scale;
        const boardZ = this.board.position.z * this.physics3dViewState.scale * 0.5; // Perspective scaling
        
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            boardX - 40,
            boardY + boardZ - 30,
            80,
            60
        );
        
        // Draw pen
        ctx.fillStyle = this.isPenDown ? '#dc2626' : '#d97706';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderDrawingArea() {
        const ctx = this.drawingCtx;
        const canvas = ctx.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        
        // Draw paper bounds
        const paperBounds = this.getPaperBoundsInWorld();
        const paperCorners = [
            this.worldToDrawingScreen({ x: paperBounds.left, y: paperBounds.bottom }),
            this.worldToDrawingScreen({ x: paperBounds.right, y: paperBounds.bottom }),
            this.worldToDrawingScreen({ x: paperBounds.right, y: paperBounds.top }),
            this.worldToDrawingScreen({ x: paperBounds.left, y: paperBounds.top })
        ];
        
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(paperCorners[0].x, paperCorners[0].y);
        paperCorners.forEach((corner, i) => {
            if (i > 0) ctx.lineTo(corner.x, corner.y);
        });
        ctx.closePath();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(37, 99, 235, 0.1)';
        ctx.fill();
        
        // Draw board bounds (lighter)
        const boardBounds = {
            left: this.board.position.x - this.board.width/2,
            right: this.board.position.x + this.board.width/2,
            bottom: this.board.position.y - this.board.height/2,
            top: this.board.position.y + this.board.height/2
        };
        
        const boardCorners = [
            this.worldToDrawingScreen({ x: boardBounds.left, y: boardBounds.bottom }),
            this.worldToDrawingScreen({ x: boardBounds.right, y: boardBounds.bottom }),
            this.worldToDrawingScreen({ x: boardBounds.right, y: boardBounds.top }),
            this.worldToDrawingScreen({ x: boardBounds.left, y: boardBounds.top })
        ];
        
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(boardCorners[0].x, boardCorners[0].y);
        boardCorners.forEach((corner, i) => {
            if (i > 0) ctx.lineTo(corner.x, corner.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw pen position
        const penScreen = this.worldToDrawingScreen(this.penPosition);
        ctx.fillStyle = this.isPenDown ? '#dc2626' : '#d97706';
        ctx.beginPath();
        ctx.arc(penScreen.x, penScreen.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            const firstPoint = this.trail[0];
            const paperWorld = this.getPaperBoundsInWorld();
            const firstWorld = {
                x: paperWorld.left + firstPoint.x,
                y: paperWorld.bottom + firstPoint.y
            };
            const firstScreen = this.worldToDrawingScreen(firstWorld);
            ctx.moveTo(firstScreen.x, firstScreen.y);
            
            for (let i = 1; i < this.trail.length; i++) {
                const point = this.trail[i];
                const world = {
                    x: paperWorld.left + point.x,
                    y: paperWorld.bottom + point.y
                };
                const screen = this.worldToDrawingScreen(world);
                ctx.lineTo(screen.x, screen.y);
            }
            
            ctx.stroke();
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HarmographApp();
});