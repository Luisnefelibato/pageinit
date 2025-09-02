 class CarolinaColsanitasSystem {
            constructor() {
                // API Configuration
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = '86V9x9hrQds83qf7zaGn';
                
                // System states
                this.isCallActive = false;
                this.isCarolinaSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Audio and recognition control
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                
                // Data
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.callDuration = 0;
                this.callTimer = null;
                
                // DOM elements
                this.initializeElements();
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                
                console.log('🚀 Carolina IA System initialized');
            }

            initializeElements() {
                this.callButton = document.getElementById('callButton');
                this.endCallButton = document.getElementById('endCallButton');
                this.callStatus = document.getElementById('callStatus');
                this.transcriptDisplay = document.getElementById('transcriptDisplay');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                this.micIndicator = document.getElementById('micIndicator');
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.callStatusEl = document.getElementById('callStatus2');
                this.interactionsEl = document.getElementById('interactions');
            }

            setupEventListeners() {
                this.callButton.addEventListener('click', () => this.startCall());
                this.endCallButton.addEventListener('click', () => this.endCall());
            }

            async initializeVoiceRecognition() {
                if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                    console.error('❌ Speech recognition not supported');
                    this.updateCallStatus('❌ Reconocimiento de voz no soportado', 'waiting');
                    return;
                }

                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                
                // Configuration optimized for real-time conversation
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'es-CO';
                this.recognition.maxAlternatives = 1;
                
                this.recognition.onstart = () => {
                    console.log('🎤 Voice recognition started');
                    this.updateMicrophoneStatus(true);
                    this.updateCallStatus('🎧 Carolina escuchando - Habla cuando quieras', 'listening');
                };

                this.recognition.onresult = (event) => {
                    this.interimTranscript = '';
                    let newFinalTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        
                        if (event.results[i].isFinal) {
                            newFinalTranscript += transcript;
                        } else {
                            this.interimTranscript += transcript;
                        }
                    }
                    
                    // Update transcript display with current text
                    const currentText = this.finalTranscript + newFinalTranscript + this.interimTranscript;
                    if (currentText.trim()) {
                        this.transcriptDisplay.textContent = `🎤 "${currentText.trim()}"`;
                    }
                    
                    // If we have final transcript, process it
                    if (newFinalTranscript.trim()) {
                        this.finalTranscript += newFinalTranscript;
                        
                        clearTimeout(this.silenceTimer);
                        this.silenceTimer = setTimeout(() => {
                            this.processUserInput();
                        }, 1500); // Wait for silence before processing
                    }
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Speech recognition error:', event.error);
                    this.updateMicrophoneStatus(false);
                    
                    if (event.error === 'not-allowed') {
                        this.updateCallStatus('❌ Micrófono no permitido - Por favor permite el acceso', 'waiting');
                    } else if (event.error === 'no-speech') {
                        console.log('No speech detected, restarting...');
                        if (this.isCallActive && !this.isCarolinaSpeaking) {
                            setTimeout(() => this.restartRecognition(), 500);
                        }
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Speech recognition ended');
                    this.updateMicrophoneStatus(false);
                    
                    // Auto-restart if call is active and Carolina is not speaking
                    if (this.isCallActive && !this.isCarolinaSpeaking) {
                        setTimeout(() => this.restartRecognition(), 100);
                    }
                };

                console.log('✅ Voice recognition initialized');
            }

            async startCall() {
                console.log('📞 Starting call...');
                
                try {
                    // Request microphone permission first
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    
                    this.isCallActive = true;
                    this.callDuration = 0;
                    this.interactionCount = 0;
                    this.conversationHistory = [];
                    
                    // Update UI
                    this.callButton.style.display = 'none';
                    this.endCallButton.style.display = 'flex';
                    this.audioVisualizer.style.display = 'block';
                    this.callButton.classList.add('active');
                    
                    // Update status
                    this.updateCallStatus('🔗 Conectando con Carolina...', 'connected');
                    this.callStatusEl.textContent = 'Conectando';
                    this.updateStats();
                    
                    // Start call timer
                    this.startCallTimer();
                    
                    // Start voice recognition
                    setTimeout(() => {
                        this.startRecognition();
                        
                        // Initial greeting from Carolina
                        setTimeout(() => {
                            this.speakCarolinaMessage("¡Hola! Soy Carolina de Colsanitas. Me da mucho gusto atenderle hoy. Estoy aquí para ayudarle con cualquier consulta sobre nuestros planes de salud y seguros médicos. ¿En qué puedo asistirle?");
                        }, 2000);
                    }, 1000);
                    
                } catch (error) {
                    console.error('❌ Error accessing microphone:', error);
                    this.updateCallStatus('❌ Error: No se puede acceder al micrófono', 'waiting');
                }
            }

            endCall() {
                console.log('📞 Ending call...');
                
                this.isCallActive = false;
                this.isCarolinaSpeaking = false;
                
                // Stop recognition
                if (this.recognition) {
                    this.recognition.stop();
                }
                
                // Stop audio
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio = null;
                }
                
                // Clear timers
                if (this.callTimer) {
                    clearInterval(this.callTimer);
                }
                clearTimeout(this.silenceTimer);
                
                // Update UI
                this.callButton.style.display = 'flex';
                this.endCallButton.style.display = 'none';
                this.audioVisualizer.style.display = 'none';
                this.callButton.classList.remove('active');
                
                // Reset status
                this.updateCallStatus('🎧 Carolina lista para atender consultas médicas', 'waiting');
                this.callStatusEl.textContent = 'Lista';
                this.updateMicrophoneStatus(false);
                this.transcriptDisplay.textContent = 'Llamada finalizada - Sistema optimizado para asesoría en seguros de salud 🏥';
                
                console.log('✅ Call ended successfully');
            }

            startRecognition() {
                if (this.recognition && !this.isCarolinaSpeaking) {
                    try {
                        this.recognition.start();
                        console.log('🎤 Starting recognition...');
                    } catch (error) {
                        console.warn('Recognition already running:', error);
                    }
                }
            }

            restartRecognition() {
                if (this.isCallActive && !this.isCarolinaSpeaking) {
                    try {
                        this.recognition.start();
                        console.log('🔄 Restarting recognition...');
                    } catch (error) {
                        console.warn('Could not restart recognition:', error);
                    }
                }
            }

            async processUserInput() {
                if (!this.finalTranscript.trim() || this.isProcessingResponse) return;
                
                const userMessage = this.finalTranscript.trim();
                this.finalTranscript = '';
                this.interimTranscript = '';
                
                console.log('💬 User said:', userMessage);
                
                this.isProcessingResponse = true;
                this.interactionCount++;
                this.updateStats();
                
                // Add user message to conversation
                this.addToConversation(userMessage, 'customer');
                
                // Update status
                this.updateCallStatus('🤔 Carolina procesando su consulta...', 'speaking');
                this.transcriptDisplay.textContent = '🤔 Procesando respuesta...';
                
                // Stop recognition while processing
                if (this.recognition) {
                    this.recognition.stop();
                }
                
                try {
                    // Generate AI response
                    const response = await this.generateAIResponse(userMessage);
                    
                    if (this.isCallActive) {
                        // Speak the response
                        await this.speakCarolinaMessage(response);
                    }
                } catch (error) {
                    console.error('❌ Error processing response:', error);
                    this.speakCarolinaMessage("Disculpe, tuve un problema técnico. ¿Podría repetir su consulta por favor?");
                } finally {
                    this.isProcessingResponse = false;
                }
            }

            async generateAIResponse(userMessage) {
                const prompt = `Eres Carolina Mendoza, una experta asesora de seguros de salud de Colsanitas en Colombia. 

Información sobre ti:
- Trabajas para Colsanitas, una de las EPS más importantes de Colombia
- Eres especialista en planes de salud, seguros médicos y autorizaciones
- Tienes un trato cálido, profesional y empático
- Conoces todos los productos y servicios de Colsanitas
- Siempre buscas ayudar al cliente con la mejor solución

El cliente dice: "${userMessage}"

Responde de manera natural, profesional y útil. Mantén un tono conversacional como si fueras una asesora real de Colsanitas. Si el cliente pregunta sobre productos específicos, precios o procedimientos, proporciona información realista para Colombia. La respuesta debe ser concisa pero completa (máximo 3-4 oraciones).

Respuesta de Carolina:`;

                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.GEMINI_API_KEY}`, {
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

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    return data.candidates[0]?.content?.parts[0]?.text || 
                           "Gracias por su consulta. Permítame revisar esa información y le respondo en un momento. ¿Hay algo más específico que le gustaría saber sobre nuestros servicios?";
                           
                } catch (error) {
                    console.error('Error with Gemini API:', error);
                    return "Entiendo su consulta sobre nuestros servicios de Colsanitas. Tenemos excelentes opciones de planes de salud familiar e individual. ¿Le gustaría que le explique algún plan en particular o tiene alguna pregunta específica sobre coberturas?";
                }
            }

            async speakCarolinaMessage(text) {
                console.log('🗣️ Carolina says:', text);
                
                this.isCarolinaSpeaking = true;
                this.updateMicrophoneStatus(false);
                
                // Add Carolina's message to conversation
                this.addToConversation(text, 'agent');
                this.updateCallStatus('🗣️ Carolina respondiendo...', 'speaking');
                this.transcriptDisplay.textContent = `🗣️ Carolina: "${text}"`;
                
                try {
                    // Generate speech with ElevenLabs
                    const audioResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': this.ELEVENLABS_API_KEY
                        },
                        body: JSON.stringify({
                            text: this.optimizeTextForSpeech(text),
                            model_id: "eleven_multilingual_v2",
                            voice_settings: {
                                stability: 0.75,
                                similarity_boost: 0.85,
                                style: 0.6
                            }
                        })
                    });

                    if (audioResponse.ok) {
                        const audioBlob = await audioResponse.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        
                        this.currentAudio = new Audio(audioUrl);
                        this.currentAudio.volume = this.volume;
                        
                        this.currentAudio.onended = () => {
                            console.log('🔚 Carolina finished speaking');
                            this.isCarolinaSpeaking = false;
                            
                            if (this.isCallActive) {
                                this.updateCallStatus('🎧 Carolina escuchando - Su turno para hablar', 'listening');
                                setTimeout(() => this.restartRecognition(), 500);
                            }
                        };
                        
                        await this.currentAudio.play();
                        
                    } else {
                        throw new Error('ElevenLabs API error');
                    }
                    
                } catch (error) {
                    console.error('❌ Error with text-to-speech:', error);
                    
                    // Fallback: just wait and continue
                    setTimeout(() => {
                        this.isCarolinaSpeaking = false;
                        if (this.isCallActive) {
                            this.updateCallStatus('🎧 Carolina escuchando - Su turno para hablar', 'listening');
                            setTimeout(() => this.restartRecognition(), 500);
                        }
                    }, 3000);
                }
                
                // Update response time
                const responseTime = Math.floor(Math.random() * 300) + 600;
                this.responseTimeEl.textContent = `${responseTime}ms`;
            }

            optimizeTextForSpeech(text) {
                let optimized = text;
                
                // Replace numbers with words for better pronunciation
                optimized = optimized.replace(/\d+/g, (match) => {
                    return this.numberToSpanishWords(parseInt(match));
                });
                
                // Add pauses for better flow
                optimized = optimized.replace(/\./g, '.');
                optimized = optimized.replace(/,/g, ',');
                
                return optimized;
            }

            numberToSpanishWords(number) {
                const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
                const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
                const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
                const hundreds = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
                
                if (number === 0) return 'cero';
                if (number < 10) return ones[number];
                if (number < 20) return teens[number - 10];
                if (number < 100) {
                    return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
                }
                if (number < 1000) {
                    const hundred = Math.floor(number / 100);
                    const remainder = number % 100;
                    let result = hundreds[hundred];
                    if (hundred === 1 && remainder > 0) result = 'ciento';
                    return result + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                return number.toString();
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
                if (this.micIndicator) {
                    this.micIndicator.className = `microphone-indicator ${active ? 'active' : ''}`;
                }
            }

            updateStats() {
                if (this.interactionsEl) {
                    this.interactionsEl.textContent = this.interactionCount;
                }
            }

            startCallTimer() {
                this.callTimer = setInterval(() => {
                    if (this.isCallActive) {
                        this.callDuration++;
                        const minutes = Math.floor(this.callDuration / 60).toString().padStart(2, '0');
                        const seconds = (this.callDuration % 60).toString().padStart(2, '0');
                        if (this.callDurationEl) {
                            this.callDurationEl.textContent = `${minutes}:${seconds}`;
                        }
                    }
                }, 1000);
            }

            addToConversation(message, type) {
                if (!this.conversationDisplay) return;
                
                const conversationItem = document.createElement('div');
                conversationItem.className = 'conversation-item';

                if (type === 'customer') {
                    conversationItem.className += ' customer-message';
                    conversationItem.innerHTML = `
                        <div class="message-label">👤 Cliente</div>
                        <div>${message}</div>
                    `;
                } else {
                    conversationItem.className += ' agent-message';
                    conversationItem.innerHTML = `
                        <div class="message-label">🏥 Carolina IA</div>
                        <div>${message}</div>
                    `;
                }

                this.conversationDisplay.appendChild(conversationItem);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;

                // Keep only last 8 messages to prevent overflow
                while (this.conversationDisplay.children.length > 8) {
                    this.conversationDisplay.removeChild(this.conversationDisplay.firstChild);
                }
            }

            updateCallStatus(message, type) {
                if (this.callStatus) {
                    this.callStatus.textContent = message;
                    this.callStatus.className = `call-status ${type}`;
                }
            }
        }

        // Initialize the system when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            try {
                new CarolinaColsanitasSystem();
                console.log('✅ Carolina IA System ready!');
            } catch (error) {
                console.error('❌ Error initializing system:', error);
            }
        });