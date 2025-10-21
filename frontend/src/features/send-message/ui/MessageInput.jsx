import { useEffect, useRef, useState } from 'react'

function MessageInput({ onSend, onUpload, disabled }) {
  const [message, setMessage] = useState('')
  const [recording, setRecording] = useState(false)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleAttachClick = () => {
    if (!disabled) fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      if (onUpload) {
        await onUpload(file)
      }
    } finally {
      e.target.value = ''
    }
  }

  const startRecording = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Voice recording is not supported in this browser/environment.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        const audioFile = new File([audioBlob], 'voice.webm', { type: mimeType })
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Upload audio file for transcription
        if (onUpload && audioBlob.size > 0) {
          try {
            await onUpload(audioFile)
          } catch (uploadErr) {
            console.error('Error uploading audio:', uploadErr)
            alert('Failed to send voice message. Please try again.')
          }
        }
      }
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        alert('Recording error occurred. Please try again.')
        setRecording(false)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Microphone access denied. Please allow microphone access and try again.'
        : err.name === 'NotFoundError'
        ? 'No microphone found. Please connect a microphone and try again.'
        : 'Could not access microphone. Please check permissions and try again.'
      alert(errorMsg)
      setRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      } catch (err) {
        console.error('Error stopping recording:', err)
      }
      setRecording(false)
    }
  }

  return (
    <form className="flex items-end gap-2 p-3 px-4 border-t border-tg-hint bg-tg-bg" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleAttachClick}
        className="w-10 h-10 border-none rounded-full bg-tg-secondary-bg text-tg-text flex items-center justify-center flex-shrink-0 active:opacity-70 transition-opacity"
        disabled={disabled}
        aria-label="Attach file"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 12V7a5 5 0 0 0-10 0v9a3 3 0 1 0 6 0V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        className={`w-10 h-10 border-none rounded-full flex items-center justify-center flex-shrink-0 active:opacity-70 transition-opacity ${recording ? 'bg-red-500 text-white' : 'bg-tg-secondary-bg text-tg-text'}`}
        disabled={disabled}
        aria-label="Voice input"
      >
        {recording ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 19v3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        )}
      </button>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        disabled={disabled}
        rows="1"
        className="flex-1 min-h-[40px] max-h-[120px] p-2.5 px-3 border border-tg-hint rounded-[20px] bg-tg-secondary-bg text-tg-text text-[15px] resize-none outline-none placeholder:text-tg-hint"
      />
      <button 
        type="submit" 
        disabled={disabled || !message.trim()}
        className="w-10 h-10 border-none rounded-full bg-tg-button text-tg-button-text flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:opacity-70 transition-opacity"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </form>
  )
}

export default MessageInput


