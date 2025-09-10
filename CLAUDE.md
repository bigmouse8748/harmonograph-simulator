# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Real Harmonograph Simulator** - A web-based interactive harmonograph drawing application that accurately simulates the physics of a suspended drawing board system to create mathematical art.

## 📈 PROJECT STATUS SUMMARY

### Development Progress (2025-01-09)
- **Physics Engine**: ✅ Complete and working (6-DOF suspended board simulation)
- **UI Framework**: ✅ Complete with clean parameter layout  
- **Core Drawing**: ❌ Multiple implementation attempts failed
- **Coordinate Systems**: ❌ Issues with world/board/canvas transformations
- **Trail Rendering**: ❌ Trails not visible despite multiple debug approaches

### Key Lessons Learned
1. **Complexity Spiral**: Started simple, became overly complex with multiple test files
2. **Debugging Challenges**: Created 17+ HTML test files trying to isolate rendering issues
3. **Coordinate Confusion**: World coordinates vs board-relative vs canvas coordinates caused issues
4. **User Feedback**: "越来越复杂了图形都可以添加" - became too complex, lost focus

### Current Decision: Complete Restart
- **Reason**: Multiple debugging attempts failed to resolve core drawing functionality
- **Approach**: Start with absolute minimal viable version, build incrementally
- **Goal**: Working trail display before adding any physics complexity

## 🎯 Harmonograph Physics Principles

### Core Concept
- **Fixed Pen**: Stationary at world origin (0,0,0)
- **Moving Board**: 2m×1.5m board suspended by 4 ropes
- **Relative Motion**: As board swings, creates patterns relative to fixed pen
- **Trail Recording**: Record pen position relative to moving board surface

### Physics Components
1. **Suspended Board**: 6-DOF rigid body (position + rotation)
2. **Rope Constraints**: 4 ropes with tension calculations
3. **Forces**: Gravity, rope tensions, damping, user impulses
4. **Integration**: Verlet or RK4 for numerical stability

## 🏗️ Project Structure (Target)

```
harmonograph/
├── src/
│   ├── physics/          # Core physics engine
│   │   ├── SuspendedBoard.js
│   │   ├── RopeSystem.js  
│   │   └── Integrator.js
│   ├── rendering/        # Canvas and drawing
│   │   ├── TrailRenderer.js
│   │   ├── BoardRenderer.js
│   │   └── CoordinateTransform.js
│   ├── ui/              # Interface components  
│   │   ├── ControlPanel.js
│   │   ├── Canvas3D.js
│   │   └── DrawingCanvas.js
│   └── utils/           # Helpers and utilities
├── public/              # Static assets
└── index.html          # Single entry point
```

## 🔄 RESTART STRATEGY: Phase-Based Development

### Phase 1: Minimal Trail Display (TOP PRIORITY)
**Goal**: Display a simple trail on canvas - NO physics
```javascript
// Minimal test: Static board, manual trail points
const trail = [{x: 0, y: 0}, {x: 50, y: 30}, {x: 100, y: 60}];
drawTrail(trail); // Must show red line on canvas
```

**Success Criteria**:
- ✅ Canvas initializes correctly
- ✅ Trail points render as connected lines
- ✅ Visual confirmation trail is visible

### Phase 2: Board Motion Without Physics
**Goal**: Move board manually, see trail follow
```javascript
// Manual board movement, trail follows
board.position = {x: 20, y: 10, z: 0};
recordTrailPoint(pen, board);
```

**Success Criteria**:
- ✅ Board position updates manually
- ✅ Trail records relative position correctly
- ✅ Multiple trail points create continuous line

### Phase 3: Simple Physics Integration
**Goal**: Add basic board motion (no rotation)
```javascript
// Simple XY physics, no Z or rotation
board.velocity.x += force.x / mass;
board.position.x += velocity.x * deltaTime;
```

**Success Criteria**:
- ✅ Board moves with realistic physics
- ✅ Trail continues recording during motion
- ✅ Patterns emerge from oscillating motion

### Phase 4: Complete System
**Goal**: Full 6-DOF physics with rotation
- Add Z-axis motion and board rotation
- Implement rope tension calculations
- Add user impulse controls

## 🛠️ Technical Specifications

### Coordinate Systems
- **World**: Fixed reference frame, pen at origin (0,0,0)
- **Board**: Local coordinates moving with board center
- **Canvas**: Screen pixels, origin top-left

### Scale and Units
- **Physics**: Meters (board 2.0m × 1.5m)
- **Rendering**: Pixels (1m = 100px)
- **Time**: Seconds with 60 FPS target

### Key Classes (Target Design)
```javascript
class SuspendedBoard {
  position: {x, y, z}     // Center of mass in world coords
  rotation: {roll, pitch, yaw} // Euler angles
  velocity: {x, y, z}     // Linear velocity
  angularVelocity: {x, y, z} // Angular velocity
  
  update(deltaTime) { /* physics integration */ }
  applyImpulse(force, point) { /* user interaction */ }
}

class TrailRenderer {
  recordPoint(penPos, boardPos) { /* relative position */ }
  render(canvas, trail) { /* draw lines */ }
}
```

## 📁 File Management

### Files to Keep
- `CLAUDE.md` (this file)
- Core source files when created

### Files to Remove
All current HTML test files (17+ files created during debugging):
- `test_*.html`, `debug_*.html`, `harmonograph_*.html`
- These became too complex and distracted from core functionality

## 🚨 Critical Implementation Rules

### Development Discipline
1. **One Feature at a Time**: Never combine systems
2. **Test Each Component**: Isolate and verify before integration  
3. **Visual Debugging**: Show intermediate results on canvas
4. **Console Logging**: Log every calculation and decision
5. **Manual Testing**: Use buttons to bypass automatic systems

### Success Metrics
- **Phase 1**: Can see a trail line on canvas
- **Phase 2**: Trail follows manually moved board
- **Phase 3**: Trail responds to simple physics
- **Phase 4**: Complete harmonograph patterns

### Anti-Patterns (Learned from Failed Attempts)
❌ Starting with complex 3D transformations
❌ Combining physics + rendering in first attempt  
❌ Creating multiple test files instead of fixing core issue
❌ Assuming coordinate systems work without verification

## 💻 Development Environment

### Tech Stack
- **Language**: Vanilla JavaScript ES6+
- **Rendering**: HTML5 Canvas 2D API
- **Physics**: Custom implementation
- **Styling**: CSS Grid/Flexbox
- **Build**: None initially (single HTML file)

### Browser Support
- Modern browsers with Canvas 2D support
- Chrome, Firefox, Safari, Edge
- ES6+ features used

## 🎯 Next Steps

1. **Delete all existing HTML files**
2. **Create single `index.html` with minimal trail rendering**
3. **Verify trail display works before adding any physics**
4. **Build incrementally following phase plan**

## Key Learning
> "越来越复杂了" - When debugging gets complex, restart with simplest approach first.

## Important Instruction Reminders
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files unless requested