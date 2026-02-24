import { useState, useEffect } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    const toast = { id, message, type }

    setToasts(prev => [...prev, toast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)

    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info: (message) => addToast(message, 'info')
  }

  return { toasts, toast, removeToast }
}

export default function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for exit animation
  }

  const getToastStyles = (type) => {
    const baseStyles = "flex items-center p-4 mb-4 text-sm border rounded-lg shadow-lg transition-all duration-300 transform max-w-xs"

    switch (type) {
      case 'success':
        return `${baseStyles} text-success bg-success/10 border-success/30`
      case 'error':
        return `${baseStyles} text-danger bg-danger/10 border-danger/30`
      case 'warning':
        return `${baseStyles} text-warning bg-warning/10 border-warning/30`
      default:
        return `${baseStyles} text-primary bg-primary/10 border-primary/30`
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div
      className={`${getToastStyles(toast.type)} ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <span className="mr-2 text-lg">{getIcon(toast.type)}</span>
      <div className="flex-1">
        {toast.message}
      </div>
      <button
        onClick={handleClose}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        ×
      </button>
    </div>
  )
}