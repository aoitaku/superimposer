interface Window {
  SpeechRecognition?: SpeechRecognitionStatic
}
declare var AudioManager

(() => {
  window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition
  const recognition = new webkitSpeechRecognition()
  const recognitionPreview = {
    element: null,
    setText (this: { element: HTMLElement}, text: string) {
      this.element.innerText = text
    },
    setClassName (this: { element: HTMLElement}, className: string) {
      this.element.className = className
    },
  }
  recognition.lang = 'ja'
  recognition.interimResults = true
  recognition.continuous = true
  recognition.addEventListener('speechstart', () => {
    // tslint:disable-next-line:no-console
    console.log('speechstart')
    recognitionPreview.setText('')
    recognitionPreview.setClassName('in-progress')
  }, false)
  recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript
      recognitionPreview.setText(text)
      if (event.results[i].isFinal) {
        recognition.stop()
        recognitionPreview.setClassName('completed')
        if (webSocket) {
          webSocket.send(text)
        }
      } else {
        if (webSocket) {
          webSocket.send(`${text}***`)
        }
      }
    }
  })
  recognition.addEventListener('soundend', () => {
    // tslint:disable-next-line:no-console
    console.log('soundend')
  })
  recognition.addEventListener('error', (error: SpeechRecognitionError) => {
    // tslint:disable-next-line:no-console
    console.log(error)
  })
  function onRecoginitionEnd () {
    // tslint:disable-next-line:no-console
    console.log('ended')
    recognition.start()
  }

  const uri = `ws://${location.host}/`
  let webSocket: WebSocket | null = null
  let audioManager: typeof AudioManager | null = null

  function connectWebSocket () {
    if (webSocket == null) {
      webSocket = new WebSocket(uri)
      webSocket.addEventListener('open', (event: Event) => {
        // tslint:disable-next-line:no-console
        console.log('connected', event)
      })
      webSocket.addEventListener('message', (event: MessageEvent) => {
        // tslint:disable-next-line:no-console
        console.log('message received')
        if (event && event.data) {
          // tslint:disable-next-line:no-console
          console.log(event.data)
        }
      })
      webSocket.addEventListener('close', (event: CloseEvent) => {
        // tslint:disable-next-line:no-console
        console.log('disconnected', event)
        webSocket = null
        setTimeout(connectWebSocket, 1000)
      })
      webSocket.addEventListener('error', (error: Event) => {
        // tslint:disable-next-line:no-console
        console.log(error)
      })
    }
  }

  function onMicOff (this: HTMLInputElement) {
    this.className = 'off'
    this.value = 'mute'
    this.addEventListener('click', onMicOn)
    webSocket = null
    audioManager.stopLoop()
    recognition.removeEventListener('end', onRecoginitionEnd)
    recognition.stop()
    const volumeIndicator = document.getElementById('volume-indicator')
    volumeIndicator.style.setProperty('height', '180px')
    volumeIndicator.style.setProperty('width', '180px')
    volumeIndicator.style.setProperty('left', '0')
    volumeIndicator.style.setProperty('top', '0')
  }

  function onMicOn (this: HTMLInputElement) {
    this.className = 'on'
    this.value = 'mic'
    this.removeEventListener('click', onMicOn)
    this.addEventListener('click', onMicOff)
    connectWebSocket()
    if (audioManager) {
      audioManager.startLoop()
    } else {
      audioManager = (new AudioManager({
        useMicrophone: true,
        onEnterFrame (this: typeof AudioManager) {
          const byteFrequencyData = Array.from(this.analysers.mic.getByteFrequencyData())
          const volume = byteFrequencyData.reduce<number>((sum: number, value: number) => {
            return sum + value
          }, 0)
          const size = volume / 2000 + 180
          const volumeIndicator = document.getElementById('volume-indicator')
          volumeIndicator.style.setProperty('height', `${size}px`)
          volumeIndicator.style.setProperty('width', `${size}px`)
          volumeIndicator.style.setProperty('left', `${(180 - size) / 2}px`)
          volumeIndicator.style.setProperty('top', `${(180 - size) / 2}px`)
        },
      }))
      audioManager.init()
    }
    recognition.addEventListener('end', onRecoginitionEnd)
    recognition.start()
  }

  window.onload = () => {
    recognitionPreview.element = document.getElementById('preview')
    const micSwitch = document.getElementById('mic')
    micSwitch.addEventListener('click', onMicOn)
  }
})()
