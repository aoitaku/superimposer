(function () {
    window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
    var recognition = new webkitSpeechRecognition();
    var recognitionPreview = {
        element: null,
        setText: function (text) {
            this.element.innerText = text;
        },
        setClassName: function (className) {
            this.element.className = className;
        }
    };
    recognition.lang = 'ja';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.addEventListener('speechstart', function () {
        // tslint:disable-next-line:no-console
        console.log('speechstart');
        recognitionPreview.setText('');
        recognitionPreview.setClassName('in-progress');
    }, false);
    recognition.addEventListener('result', function (event) {
        for (var i = event.resultIndex; i < event.results.length; i++) {
            var text = event.results[i][0].transcript;
            recognitionPreview.setText(text);
            if (event.results[i].isFinal) {
                recognition.stop();
                recognitionPreview.setClassName('completed');
                if (webSocket) {
                    webSocket.send(text);
                }
            }
            else {
                if (webSocket) {
                    webSocket.send(text + "***");
                }
            }
        }
    });
    recognition.addEventListener('soundend', function () {
        // tslint:disable-next-line:no-console
        console.log('soundend');
    });
    recognition.addEventListener('error', function (error) {
        // tslint:disable-next-line:no-console
        console.log(error);
    });
    function onRecoginitionEnd() {
        // tslint:disable-next-line:no-console
        console.log('ended');
        recognition.start();
    }
    var uri = "ws://" + location.host + "/";
    var webSocket = null;
    var audioManager = null;
    function connectWebSocket() {
        if (webSocket == null) {
            webSocket = new WebSocket(uri);
            webSocket.addEventListener('open', function (event) {
                // tslint:disable-next-line:no-console
                console.log('connected', event);
            });
            webSocket.addEventListener('message', function (event) {
                // tslint:disable-next-line:no-console
                console.log('message received');
                if (event && event.data) {
                    // tslint:disable-next-line:no-console
                    console.log(event.data);
                }
            });
            webSocket.addEventListener('close', function (event) {
                // tslint:disable-next-line:no-console
                console.log('disconnected', event);
                webSocket = null;
                setTimeout(connectWebSocket, 1000);
            });
            webSocket.addEventListener('error', function (error) {
                // tslint:disable-next-line:no-console
                console.log(error);
            });
        }
    }
    function onMicOff() {
        this.className = 'off';
        this.value = 'mute';
        this.addEventListener('click', onMicOn);
        webSocket = null;
        audioManager.stopLoop();
        recognition.removeEventListener('end', onRecoginitionEnd);
        recognition.stop();
        var volumeIndicator = document.getElementById('volume-indicator');
        volumeIndicator.style.setProperty('height', '180px');
        volumeIndicator.style.setProperty('width', '180px');
        volumeIndicator.style.setProperty('left', '0');
        volumeIndicator.style.setProperty('top', '0');
    }
    function onMicOn() {
        this.className = 'on';
        this.value = 'mic';
        this.removeEventListener('click', onMicOn);
        this.addEventListener('click', onMicOff);
        connectWebSocket();
        if (audioManager) {
            audioManager.startLoop();
        }
        else {
            audioManager = (new AudioManager({
                useMicrophone: true,
                onEnterFrame: function () {
                    var byteFrequencyData = Array.from(this.analysers.mic.getByteFrequencyData());
                    var volume = byteFrequencyData.reduce(function (sum, value) {
                        return sum + value;
                    }, 0);
                    var size = volume / 2000 + 180;
                    var volumeIndicator = document.getElementById('volume-indicator');
                    volumeIndicator.style.setProperty('height', size + "px");
                    volumeIndicator.style.setProperty('width', size + "px");
                    volumeIndicator.style.setProperty('left', (180 - size) / 2 + "px");
                    volumeIndicator.style.setProperty('top', (180 - size) / 2 + "px");
                }
            }));
            audioManager.init();
        }
        recognition.addEventListener('end', onRecoginitionEnd);
        recognition.start();
    }
    window.onload = function () {
        recognitionPreview.element = document.getElementById('preview');
        var micSwitch = document.getElementById('mic');
        micSwitch.addEventListener('click', onMicOn);
    };
})();
