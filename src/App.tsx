import favicon from './assets/favicon.png'
import './App.css'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center justify-center gap-8">
        <img src={favicon} className="size-40 object-contain" alt="hero" />
        <div className="text-4xl font-bold">
          Hello, world!
        </div>
      </div>
    </div>
  )
}

export default App
