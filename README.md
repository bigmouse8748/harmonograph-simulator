# Harmonograph Simulator 🎨

A web-based interactive harmonograph drawing application that accurately simulates the physics of a suspended drawing board system to create mathematical art.

## 🌟 Features

- **Real Physics Simulation**: Accurate 6-DOF rigid body dynamics with four-rope suspension system
- **Interactive Controls**: 
  - Drag to set initial board position
  - Adjustable swing speed (0.1x - 3.0x)
  - Adjustable air damping (0.05 - 2.00)
- **Realistic Visualization**: 
  - Top-view perspective with proper rope mechanics
  - Wooden board texture with paper drawing area
  - Fixed pen drawing on moving board
- **Smart Drawing System**:
  - Automatic line breaking when pen leaves paper
  - Drawing restricted to white paper area
  - Unlimited trail points for complex patterns

## 🚀 Live Demo

[Try it online](https://bigmouse8748.github.io/harmonograph-simulator/) (Coming soon)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/bigmouse8748/harmonograph-simulator.git
cd harmonograph-simulator
```

2. Open `index.html` in your web browser

That's it! No build process or dependencies required.

## 📖 How to Use

1. **Initialize Physics Engine**: Click "5. 初始化物理引擎" to set up the simulation
2. **Adjust Parameters**:
   - Use the speed slider to control swing speed
   - Use the damping slider to control how quickly the motion decays
3. **Set Initial Position**: Drag the board to your desired starting position
4. **Start Simulation**: Click "6. 启动物理模拟" to begin drawing
5. **Watch the Art**: The pen will draw beautiful patterns as the board swings

## 🎯 Physics Model

The simulator implements a realistic suspended board system with:

- **Board**: 80cm × 60cm, 2kg mass
- **Ropes**: 1m length, spring constant 800 N/m
- **Coordinate System**: Fixed pen at center, moving board
- **Integration**: Euler method with 60 FPS fixed timestep

## 🔧 Technical Details

- Pure HTML5/JavaScript/Canvas - no frameworks required
- Real-time physics simulation with accurate force calculations
- Responsive canvas that adapts to window size
- Efficient rendering with proper z-ordering

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 👤 Author

**bigmouse8748**

- GitHub: [@bigmouse8748](https://github.com/bigmouse8748)

## 🙏 Acknowledgments

- Inspired by traditional harmonograph machines
- Physics simulation based on classical mechanics principles
- Created with the help of Claude AI

---

⭐ If you like this project, please give it a star on GitHub!