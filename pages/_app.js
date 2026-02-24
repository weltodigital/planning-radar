import '../styles/globals.css'
import Analytics from '../components/Analytics'
import ToastContainer, { useToast } from '../components/Toast'

export default function App({ Component, pageProps }) {
  const { toasts, toast, removeToast } = useToast()

  return (
    <>
      <Analytics />
      <Component {...pageProps} toast={toast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}