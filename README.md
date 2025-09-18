# Shanks Protocol - Ocean Data Analysis Platform

A sophisticated Next.js 15 web application for real-time oceanographic data analysis powered by Argovis API and AI.

## 🌊 Features

### Dual Mode Interface
- **Explorer Mode**: Clean, intuitive interface for students and general users
- **Power Mode**: Advanced analytical tools for scientists and researchers

### Advanced Visualizations
- Interactive Plotly charts with real-time data
- Geospatial maps showing ARGO float positions
- Multi-variable analysis with synchronized views
- Responsive design optimized for all devices

### AI-Powered Analysis
- LLM-RAG-MCP integration for intelligent data interpretation
- Dynamic response styles adapted to user type
- Real-time natural language query processing
- Contextual suggestions and guided exploration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+ (for backend integration)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Architecture

### Frontend (Next.js 15)
- **App Router**: Modern Next.js routing with server components
- **Tailwind CSS**: Utility-first styling with custom ocean theme
- **Framer Motion**: Smooth animations and transitions
- **Plotly.js**: Interactive scientific visualizations
- **Locomotive Scroll**: Smooth scrolling with inertia

### Backend Integration
- **Python Backend**: Advanced ocean chat system with LLM-RAG-MCP
- **Argovis API**: Real-time oceanographic data from ARGO floats
- **API Routes**: Next.js API routes for seamless integration

## 🎨 Design System

### Color Palette
- **Ocean Blue**: Primary brand colors (#0ea5e9, #38bdf8)
- **Flynzo Dark**: Professional dark theme (#0f172a, #1e293b)
- **Glass Morphism**: Translucent UI elements with backdrop blur

### Typography
- **Inter Font**: Modern, readable typeface
- **Responsive Scaling**: Adaptive text sizes across devices

### Interactions
- **Custom Cursor**: Animated cursor with hover effects
- **Smooth Transitions**: Framer Motion animations
- **Loading States**: Elegant loading indicators

## 📊 Data Flow

1. **User Query** → Natural language input
2. **Intent Detection** → AI-powered query classification
3. **Data Fetching** → Argovis API integration with smart batching
4. **AI Analysis** → LLM processing with dynamic response styles
5. **Visualization** → Real-time chart and map generation
6. **User Feedback** → Interactive exploration and refinement

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:
```env
ARGOVIS_API_KEY=your_argovis_api_key
GROQ_API_KEY=your_groq_api_key
```

### API Integration
The frontend connects to the Python backend via API routes:
- `/api/ocean/query` - Main query processing endpoint
- Automatic data transformation and visualization

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Enhanced layouts for tablets
- **Desktop**: Full-featured desktop experience
- **Touch Interactions**: Gesture support for mobile

## 🎯 Performance

- **Lighthouse Score**: 90+ optimization target
- **Lazy Loading**: Heavy libraries loaded on demand
- **Streaming**: Next.js 15 RSC streaming for fast loads
- **Caching**: Intelligent data caching strategies

## 🧪 Testing

Run the enhanced system test:
```bash
python test_enhanced_system.py
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Vercel Deployment
```bash
vercel --prod
```

## 📈 Future Enhancements

- [ ] Real-time data streaming
- [ ] Advanced statistical analysis
- [ ] Export functionality (PDF, CSV)
- [ ] Collaborative features
- [ ] Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🌊 Credits

- **Argovis**: Oceanographic data source
- **Flynzo**: Platform development
- **Shanks Protocol**: Analysis framework

---

*Built with ❤️ for ocean science and data visualization*