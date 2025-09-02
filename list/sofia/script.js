
// === SISTEMA IA SOFIA CLARO ===
class SofiaClaro {
            constructor() {
                // APIs - CONFIGURACIÓN
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Voz femenina profesional
                
                // Estados principales
                this.isCallActive = false;
                this.isSofiaSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Control de audio y reconocimiento
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                this.callTimer = null;
                this.callStartTime = null;
                
                // Datos de conversación
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                
                // Elementos DOM
                this.initializeDOMElements();
                this.initializeSystem();
            }

            initializeDOMElements() {
                this.callButton = document.getElementById('callButton');
                this.volumeButton = document.getElementById('volumeButton');
                this.stopButton = document.getElementById('stopButton');
                this.callStatus = document.getElementById('callStatus');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.transcriptDisplay = document.getElementById('transcriptDisplay');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.micIndicator = document.getElementById('micIndicator');
                
                // Estadísticas
                this.responseTimeEl = document.getElementById('responseTime');
                this.callDurationEl = document.getElementById('callDuration');
                this.interactionsEl = document.getElementById('interactions');
                this.sofiaStatusEl = document.getElementById('sofiaStatus');
            }

            initializeSystem() {
                console.log('🚀 Inicializando Sofia IA System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('📞 Sofía está lista para atender - Sistema activado', 'waiting');
                this.updateMicrophoneStatus(false);
                console.log('✅ Sistema Sofia inicializado correctamente');
            }

            // === CONTROL DE ESTADOS ===
            updateCallStatus(message, type) {
                this.callStatus.innerHTML = message + ' <span class="microphone-indicator" id="micIndicator"></span>';
                this.callStatus.className = `call-status ${type}`;
                this.micIndicator = document.getElementById('micIndicator');
                if (this.isMicrophoneActive) {
                    this.micIndicator.classList.add('active');
                }
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
                if (this.micIndicator) {
                    this.micIndicator.className = `microphone-indicator ${active ? 'active' : ''}`;
                }
            }

            updateSofiaStatus(status) {
                this.sofiaStatusEl.textContent = status;
            }

            updateStats() {
                this.interactionsEl.textContent = this.interactionCount;
                
                if (this.callStartTime) {
                    const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
                    const minutes = Math.floor(duration / 60);
                    const seconds = duration % 60;
                    this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }

            // === CONFIGURACIÓN DE EVENTOS ===
            setupEventListeners() {
                this.callButton.addEventListener('click', () => {
                    if (this.isCallActive) {
                        this.endCall();
                    } else {
                        this.startCall();
                    }
                });

                this.volumeButton.addEventListener('click', () => {
                    this.toggleVolume();
                });

                this.stopButton.addEventListener('click', () => {
                    this.stopAudio();
                });
            }

            // === GESTIÓN DE LLAMADAS ===
            async startCall() {
                if (this.isCallActive) return;
                
                console.log('📞 Iniciando llamada...');
                this.isCallActive = true;
                this.callStartTime = Date.now();
                this.interactionCount = 0;
                
                this.callButton.innerHTML = '<i class="fas fa-phone-slash"></i> Terminar Llamada';
                this.callButton.classList.add('active');
                this.stopButton.style.display = 'inline-flex';
                
                this.updateCallStatus('🔄 Conectando con Sofía...', 'connected');
                this.updateSofiaStatus('Conectando');
                this.audioVisualizer.classList.add('active');
                this.transcriptDisplay.classList.add('active');
                
                // Limpiar conversación
                this.conversationHistory = [];
                this.conversationDisplay.innerHTML = '';
                
                // Iniciar timer
                this.startCallTimer();
                
                // Activar micrófono después de un breve delay
                setTimeout(() => {
                    if (this.isCallActive) {
                        this.activateMicrophone();
                        this.updateCallStatus('🎧 Sofía te escucha - Puedes hablar', 'listening');
                        this.updateSofiaStatus('Escuchando');
                        
                        // Saludo inicial de Sofía
                        setTimeout(() => {
                            if (this.isCallActive) {
                                this.processAIResponse('¡Hola! Soy Sofía de Claro Colombia. ¿En qué puedo ayudarte con nuestros planes móviles hoy?');
                            }
                        }, 1000);
                    }
                }, 2000);
            }

            endCall() {
                if (!this.isCallActive) return;
                
                console.log('📞 Terminando llamada...');
                this.isCallActive = false;
                
                this.callButton.innerHTML = '<i class="fas fa-phone"></i> Iniciar Llamada';
                this.callButton.classList.remove('active');
                this.stopButton.style.display = 'none';
                
                this.updateCallStatus('📞 Sofía está lista para atender - Sistema activado', 'waiting');
                this.updateSofiaStatus('Lista');
                this.audioVisualizer.classList.remove('active');
                this.transcriptDisplay.classList.remove('active');
                this.transcriptDisplay.textContent = 'Sistema optimizado para asesoría en planes móviles Claro Colombia 📱';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                if (this.callTimer) {
                    clearInterval(this.callTimer);
                    this.callTimer = null;
                }
                
                this.callDurationEl.textContent = '00:00';
            }

            startCallTimer() {
                this.callTimer = setInterval(() => {
                    this.updateStats();
                }, 1000);
            }

            // === RECONOCIMIENTO DE VOZ ===
            initializeVoiceRecognition() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.error('❌ Reconocimiento de voz no soportado');
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'es-CO';
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    console.log('🎤 Reconocimiento iniciado');
                    this.updateMicrophoneStatus(true);
                    this.finalTranscript = '';
                    this.interimTranscript = '';
                };

                this.recognition.onresult = (event) => {
                    this.interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        
                        if (event.results[i].isFinal) {
                            this.finalTranscript += transcript + ' ';
                        } else {
                            this.interimTranscript += transcript;
                        }
                    }
                    
                    const currentText = this.finalTranscript + this.interimTranscript;
                    if (currentText.trim()) {
                        this.transcriptDisplay.textContent = `🎤 Cliente: "${currentText.trim()}"`;
                    }
                    
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (this.finalTranscript.trim()) {
                            this.processUserInput();
                        }
                    }, 2000);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isSofiaSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isSofiaSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };
            }

            activateMicrophone() {
                if (!this.recognition || this.isSofiaSpeaking || this.isProcessingResponse) return;
                
                try {
                    this.recognition.start();
                    console.log('🎤 Micrófono activado');
                } catch (error) {
                    console.warn('⚠️ Error activando micrófono:', error);
                }
            }

            deactivateMicrophone() {
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                        this.updateMicrophoneStatus(false);
                        console.log('🎤 Micrófono desactivado');
                    } catch (error) {
                        console.warn('⚠️ Error desactivando micrófono:', error);
                    }
                }
            }

            // === PROCESAMIENTO DE ENTRADA ===
            async processUserInput() {
                if (!this.isCallActive || this.isProcessingResponse) return;
                
                const userInput = this.finalTranscript.trim();
                if (!userInput) return;
                
                console.log('👤 Usuario dijo:', userInput);
                this.finalTranscript = '';
                this.interimTranscript = '';
                
                this.addToConversation(userInput, 'customer');
                this.interactionCount++;
                this.updateStats();
                
                this.deactivateMicrophone();
                this.updateCallStatus('🤖 Sofía procesando...', 'processing');
                this.updateSofiaStatus('Procesando');
                
                try {
                    const response = await this.getAIResponse(userInput);
                    if (this.isCallActive) {
                        await this.processAIResponse(response);
                    }
                } catch (error) {
                    console.error('❌ Error procesando:', error);
                    if (this.isCallActive) {
                        await this.processAIResponse('Disculpe, tuve un problema técnico. ¿Puede repetir su consulta?');
                    }
                }
            }

            // === IA Y RESPUESTAS ===
            async getAIResponse(userInput) {
                const startTime = Date.now();
                
                const prompt = `Eres Sofía, asesora comercial especializada en telecomunicaciones de Claro Colombia. 

CONTEXTO: Cliente llama para consultar sobre planes móviles, internet hogar, servicios digitales.

INFORMACIÓN CLARO COLOMBIA:
- Planes móviles: Familia (20GB $89,900), Individual (15GB $69,900), Joven (10GB $49,900)
- Internet hogar: 100Mbps ($79,900), 200Mbps ($99,900), 300Mbps ($119,900)
- Servicios: Netflix gratis, WhatsApp ilimitado, llamadas nacionales gratis
- Promociones: 3 meses Netflix gratis, primer mes 50% descuento
- Cobertura: 4G/5G en principales ciudades colombianas

INSTRUCCIONES:
1. Responde como Sofía, cálida pero profesional
2. Enfócate en las necesidades del cliente
3. Ofrece soluciones específicas de Claro
4. Usa precios y promociones reales
5. Máximo 2-3 oraciones por respuesta
6. Incluye preguntas para seguir la conversación

CLIENTE DICE: "${userInput}"

Responde como Sofía:`;

                try {
                    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + this.GEMINI_API_KEY, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }]
                        })
                    });

                    const data = await response.json();
                    const aiResponse = data.candidates[0].content.parts[0].text;
                    
                    const responseTime = Date.now() - startTime;
                    this.responseTimeEl.textContent = `${responseTime}ms`;
                    
                    return aiResponse;
                } catch (error) {
                    console.error('❌ Error AI:', error);
                    return 'Disculpe, permíteme ayudarle. ¿Qué plan móvil le interesa para su familia?';
                }
            }

            async processAIResponse(response) {
                if (!this.isCallActive) return;
                
                console.log('🤖 Sofía responde:', response);
                this.addToConversation(response, 'sofia');
                
                this.transcriptDisplay.textContent = `🤖 Sofía: "${response}"`;
                
                // Convertir a audio
                await this.speakResponse(response);
                
                if (this.isCallActive) {
                    this.updateCallStatus('🎧 Sofía te escucha - Puedes hablar', 'listening');
                    this.updateSofiaStatus('Escuchando');
                    setTimeout(() => this.activateMicrophone(), 500);
                }
            }

            // === SÍNTESIS DE VOZ ===
            async speakResponse(text) {
                if (!this.isCallActive) return;
                
                this.isSofiaSpeaking = true;
                this.updateCallStatus('🗣️ Sofía hablando...', 'speaking');
                this.updateSofiaStatus('Hablando');
                
                try {
                    const optimizedText = this.optimizeForSpeech(text);
                    
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': this.ELEVENLABS_API_KEY
                        },
                        body: JSON.stringify({
                            text: optimizedText,
                            model_id: 'eleven_multilingual_v2',
                            voice_settings: {
                                stability: 0.8,
                                similarity_boost: 0.8,
                                style: 0.2,
                                use_speaker_boost: true
                            }
                        })
                    });

                    if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        
                        this.currentAudio = new Audio(audioUrl);
                        this.currentAudio.volume = this.volume;
                        
                        this.currentAudio.onended = () => {
                            this.isSofiaSpeaking = false;
                            URL.revokeObjectURL(audioUrl);
                        };
                        
                        await this.currentAudio.play();
                    } else {
                        throw new Error('Error en síntesis de voz');
                    }
                } catch (error) {
                    console.error('❌ Error síntesis:', error);
                    this.isSofiaSpeaking = false;
                }
            }

            optimizeForSpeech(text) {
                let optimized = text;
                
                // Optimizaciones para español colombiano
                optimized = optimized.replace(/\$(\d{1,3}(?:,\d{3})*)/g, (match, number) => {
                    return number.replace(/,/g, ' mil ') + ' pesos';
                });
                
                optimized = optimized.replace(/(\d+)GB/g, '$1 gigas');
                optimized = optimized.replace(/4G/g, 'cuatro G');
                optimized = optimized.replace(/5G/g, 'cinco G');
                optimized = optimized.replace(/Mbps/g, 'megas por segundo');
                
                return optimized;
            }

            // === GESTIÓN DE CONVERSACIÓN ===
            addToConversation(message, type) {
                const conversationItem = document.createElement('div');
                conversationItem.className = 'conversation-item';

                if (type === 'customer') {
                    conversationItem.className += ' customer-message';
                    conversationItem.innerHTML = `
                        <div class="message-label">👤 Cliente</div>
                        <div>${message}</div>
                    `;
                } else {
                    conversationItem.className += ' sofia-message';
                    conversationItem.innerHTML = `
                        <div class="message-label">🤖 Sofía IA</div>
                        <div>${message}</div>
                    `;
                }

                this.conversationDisplay.appendChild(conversationItem);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;

                // Mantener máximo 10 mensajes
                while (this.conversationDisplay.children.length > 10) {
                    this.conversationDisplay.removeChild(this.conversationDisplay.firstChild);
                }

                this.conversationHistory.push({ type, message, timestamp: new Date() });
            }

            // === CONTROLES DE AUDIO ===
            toggleVolume() {
                if (this.volume > 0) {
                    this.volume = 0;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-mute"></i> Volumen: Mudo';
                } else {
                    this.volume = 0.8;
                    this.volumeButton.innerHTML = '<i class="fas fa-volume-up"></i> Volumen: Alto';
                }
                
                if (this.currentAudio) {
                    this.currentAudio.volume = this.volume;
                }
            }

            stopAudio() {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio = null;
                    this.isSofiaSpeaking = false;
                }
            }
        }

        // === INICIALIZACIÓN ===
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Iniciando Sofia Claro Sistema...');
            window.sofiaSystem = new SofiaClaro();
        });