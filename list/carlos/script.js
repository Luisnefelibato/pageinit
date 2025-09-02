class CarlosFinanzasSystem {
            constructor() {
                // APIs - Configuración real
                this.GEMINI_API_KEY = 'AIzaSyC2sGWOkbp6Z1xfns5cZWM5Ti8nTPWUBEE';
                this.ELEVENLABS_API_KEY = 'sk_461f0eb94d7fc7f8b2e24f6d6136824392cd88050c27eebc';
                this.ELEVENLABS_VOICE_ID = 'Ux2YbCNfurnKHnzlBHGX'; // Voz masculina profesional
                
                // Estados del sistema
                this.isCallActive = false;
                this.isCarlosSpeaking = false;
                this.isMicrophoneActive = false;
                this.isProcessingResponse = false;
                
                // Control de audio y reconocimiento
                this.volume = 0.8;
                this.recognition = null;
                this.currentAudio = null;
                this.silenceTimer = null;
                this.microphoneTimer = null;
                
                // Datos de conversación
                this.finalTranscript = '';
                this.interimTranscript = '';
                this.conversationHistory = [];
                this.interactionCount = 0;
                this.clientName = null;
                
                // Elementos DOM
                this.initializeDOMElements();
                this.initializeSystem();
            }

            initializeDOMElements() {
                this.callButton = document.getElementById('callButton');
                this.endCallButton = document.getElementById('endCallButton');
                this.callStatus = document.getElementById('callStatus');
                this.callStatus2 = document.getElementById('callStatus2');
                this.conversationDisplay = document.getElementById('conversationDisplay');
                this.transcriptDisplay = document.getElementById('transcriptDisplay');
                this.audioVisualizer = document.getElementById('audioVisualizer');
                
                // Estadísticas
                this.callDurationEl = document.getElementById('callDuration');
                this.responseTimeEl = document.getElementById('responseTime');
                this.interactionsEl = document.getElementById('interactions');
            }

            initializeSystem() {
                console.log('🚀 Inicializando Carlos Finanzas System...');
                this.setupEventListeners();
                this.initializeVoiceRecognition();
                this.updateCallStatus('💰 Carlos listo para gestionar sus finanzas', 'waiting');
                this.updateMicrophoneStatus(false);
                console.log('✅ Sistema Carlos Finanzas inicializado correctamente');
            }

            // === CONFIGURACIÓN DE EVENTOS ===
            setupEventListeners() {
                this.callButton.addEventListener('click', () => this.startCall());
                this.endCallButton.addEventListener('click', () => this.endCall());
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
                    this.updateCallStatus('🎧 Carlos escucha - Consulte sobre sus finanzas', 'listening');
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
                        this.transcriptDisplay.textContent = `🎤 "${currentText.trim()}"`;
                    }
                    
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = setTimeout(() => {
                        if (this.finalTranscript.trim()) {
                            this.processUserInput();
                        }
                    }, 1500);
                };

                this.recognition.onerror = (event) => {
                    console.warn('❌ Error reconocimiento:', event.error);
                    clearTimeout(this.silenceTimer);
                    this.updateMicrophoneStatus(false);
                    
                    if (this.isCallActive && !this.isCarlosSpeaking) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };

                this.recognition.onend = () => {
                    console.log('🔚 Reconocimiento terminado');
                    this.updateMicrophoneStatus(false);
                    
                    if (this.finalTranscript.trim()) {
                        this.processUserInput();
                    } else if (this.isCallActive && !this.isCarlosSpeaking && !this.isProcessingResponse) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                };
            }

            // === CONTROL DE ESTADOS ===
            updateCallStatus(message, type) {
                this.callStatus.textContent = message;
                this.callStatus.className = `call-status ${type}`;
            }

            updateMicrophoneStatus(active) {
                this.isMicrophoneActive = active;
                console.log(active ? '🎤 Micrófono activado' : '🔇 Micrófono desactivado');
            }

            // === CONTROL DE MICRÓFONO ===
            activateMicrophone() {
                if (!this.isCallActive || this.isCarlosSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
                    return;
                }

                console.log('🎤 Activando micrófono...');
                
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error activando micrófono:', error);
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            }

            deactivateMicrophone() {
                console.log('🔇 Desactivando micrófono...');
                
                clearTimeout(this.silenceTimer);
                clearTimeout(this.microphoneTimer);
                
                this.updateMicrophoneStatus(false);
                
                if (this.recognition) {
                    try {
                        this.recognition.stop();
                    } catch (e) {
                        // Ignorar errores
                    }
                }
                
                this.finalTranscript = '';
                this.interimTranscript = '';
            }

            // === PROCESAMIENTO DE ENTRADA DEL USUARIO ===
            async processUserInput() {
                const userMessage = this.finalTranscript.trim();
                if (!userMessage) return;

                console.log('🧠 Procesando consulta financiera:', userMessage);
                
                this.deactivateMicrophone();
                this.addToConversation(userMessage, 'customer');
                this.interactionCount++;
                this.interactionsEl.textContent = this.interactionCount;
                
                this.isProcessingResponse = true;
                this.updateCallStatus('⚡ Carlos procesando consulta financiera...', 'processing');
                this.callStatus2.textContent = 'Procesando';

                const startTime = performance.now();

                try {
                    const response = await this.generateFinancialResponse(userMessage);
                    const endTime = performance.now();
                    const responseTime = Math.round(endTime - startTime);
                    
                    this.responseTimeEl.textContent = `${responseTime}ms`;
                    this.addToConversation(response, 'agent');
                    
                    this.isProcessingResponse = false;
                    await this.speakResponse(response);
                    
                } catch (error) {
                    console.error('Error procesando consulta:', error);
                    this.isProcessingResponse = false;
                    const fallbackResponse = 'Disculpe, ¿podría repetir su consulta financiera?';
                    this.addToConversation(fallbackResponse, 'agent');
                    await this.speakResponse(fallbackResponse);
                }
            }

            // === GENERACIÓN DE RESPUESTAS FINANCIERAS ===
            async generateFinancialResponse(userMessage) {
                const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
                
                let conversationContext = '';
                if (this.conversationHistory.length > 0) {
                    conversationContext = this.conversationHistory.slice(-4).map(entry => 
                        `${entry.speaker === 'customer' ? 'Cliente' : 'Carlos'}: ${entry.message}`
                    ).join('\n');
                }
                
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `Eres Carlos Morales, especialista en recordatorios financieros con 10 años de experiencia en bancos y entidades crediticias.

CONTEXTO: El cliente te contactó por recordatorios de pagos y asesoría financiera.

CONVERSACIÓN PREVIA:
${conversationContext}

REGLAS CRÍTICAS PARA ELEVENLABS (NÚMEROS EN ESPAÑOL):
- Dinero: "dos millones quinientos mil pesos" NO "$2,500,000"
- Porcentajes: "tres punto cinco por ciento" NO "3.5%"  
- Fechas: "quince de abril" NO "15/04"
- Cuotas: "cuota número veintitrés" NO "cuota #23"
- Tarjetas: "cuatro dígitos cinco seis siete ocho" NO "5678"

PERSONALIDAD:
- Especialista financiero profesional y confiable
- NUNCA mencionar "IA" o "inteligencia artificial"
- Enfoque en prevención y organización financiera
- Empático con dificultades económicas
- Soluciones prácticas y realistas

ESPECIALIDADES:
1. TARJETAS DE CRÉDITO: Fechas de pago, intereses, consolidación
2. CRÉDITOS HIPOTECARIOS: Cuotas, refinanciación, prepagos
3. CRÉDITOS VEHICULARES: Pagos, seguros, SOAT
4. EDUCACIÓN FINANCIERA: Presupuestos, ahorro, inversión
5. NEGOCIACIÓN: Reestructuración de deudas, acuerdos de pago

PRODUCTOS/SERVICIOS QUE MANEJO:
- Recordatorios automáticos de pagos
- Calendarios financieros personalizados
- Asesoría en refinanciación
- Planes de consolidación de deudas
- Estrategias de mejora crediticia

INFORMACIÓN QUE NECESITO:
- Nombre completo y número de contacto
- Tipo de crédito o tarjeta
- Fechas de vencimiento actuales
- Montos de las cuotas
- Banco o entidad financiera

EJEMPLOS DE RESPUESTAS:
"Buenos días, soy Carlos Morales, especialista en recordatorios financieros. Veo que necesita organizar sus pagos. ¿Me puede contar qué créditos o tarjetas tiene actualmente?"

"Perfecto, para su tarjeta de crédito Bancolombia, la fecha de pago es el veinticinco de cada mes. Le recomiendo programar un recordatorio tres días antes. ¿Le gustaría que coordinemos un plan de pagos?"

"Entiendo su situación con el crédito hipotecario. Tenemos opciones de refinanciación que pueden reducir su cuota hasta un treinta por ciento. ¿Me permite revisar sus opciones?"

TU MISIÓN:
Ayudar al cliente a organizar sus finanzas, prevenir mora y encontrar las mejores opciones de pago. Sé profesional, empático y orientado a soluciones.

Cliente consulta: "${userMessage}"

Responde como Carlos, especialista financiero (máximo 60 palabras, natural y útil):`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 30,
                        topP: 0.85,
                        maxOutputTokens: 120,
                    }
                };

                try {
                    const controller = new AbortController();
                    setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                        signal: controller.signal
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const rawResponse = data.candidates[0].content.parts[0].text.trim();
                        return this.optimizeForElevenLabs(rawResponse);
                    } else {
                        throw new Error('Gemini error');
                    }
                } catch (error) {
                    console.warn('Gemini timeout, usando respuesta financiera de respaldo');
                    return this.getFinancialFallbackResponse(userMessage);
                }
            }

            // === OPTIMIZACIÓN PARA ELEVENLABS ===
            optimizeForElevenLabs(text) {
                let optimized = text;
                
                // Dinero y cifras
                optimized = optimized.replace(/\$\s*(\d{1,3}(?:[.,]\d{3})*)/g, (match, number) => {
                    const cleanNumber = parseInt(number.replace(/[.,]/g, ''));
                    return this.numberToSpanishWords(cleanNumber) + ' pesos';
                });
                
                // Porcentajes
                optimized = optimized.replace(/(\d+(?:\.\d+)?)\s*%/g, (match, number) => {
                    if (number.includes('.')) {
                        const parts = number.split('.');
                        return this.numberToSpanishWords(parseInt(parts[0])) + ' punto ' + 
                               this.numberToSpanishWords(parseInt(parts[1])) + ' por ciento';
                    }
                    return this.numberToSpanishWords(parseInt(number)) + ' por ciento';
                });
                
                // Fechas
                optimized = optimized.replace(/(\d{1,2})\/(\d{1,2})/g, (match, day, month) => {
                    return this.numberToSpanishWords(parseInt(day)) + ' del ' + 
                           this.numberToSpanishWords(parseInt(month));
                });
                
                // Números de tarjetas (últimos dígitos)
                optimized = optimized.replace(/(\d{4})(?=\s|$)/g, (match, digits) => {
                    return digits.split('').map(d => this.numberToSpanishWords(parseInt(d))).join(' ');
                });
                
                return optimized;
            }

            // === CONVERSIÓN NÚMEROS A ESPAÑOL ===
            numberToSpanishWords(number) {
                if (number === 0) return 'cero';
                if (number === 100) return 'cien';
                
                const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
                const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
                const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
                const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
                
                if (number < 10) return ones[number];
                
                if (number < 20) return teens[number - 10];
                
                if (number < 30) {
                    return number === 20 ? 'veinte' : 'veinti' + ones[number % 10];
                }
                
                if (number < 100) {
                    return tens[Math.floor(number / 10)] + (number % 10 > 0 ? ' y ' + ones[number % 10] : '');
                }
                
                if (number < 1000) {
                    const hundred = Math.floor(number / 100);
                    const remainder = number % 100;
                    return hundreds[hundred] + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                if (number < 1000000) {
                    const thousands = Math.floor(number / 1000);
                    const remainder = number % 1000;
                    const thousandsText = thousands === 1 ? 'mil' : this.numberToSpanishWords(thousands) + ' mil';
                    return thousandsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
                }
                
                // Millones
                const millions = Math.floor(number / 1000000);
                const remainder = number % 1000000;
                const millionsText = millions === 1 ? 'un millón' : this.numberToSpanishWords(millions) + ' millones';
                return millionsText + (remainder > 0 ? ' ' + this.numberToSpanishWords(remainder) : '');
            }

            // === RESPUESTAS DE RESPALDO ===
            getFinancialFallbackResponse(userMessage) {
                const msg = userMessage.toLowerCase();
                
                if (msg.includes('tarjeta') || msg.includes('crédito')) {
                    return 'Como especialista financiero, puedo ayudarle con recordatorios de pago de tarjetas. ¿Me comparte qué tarjetas tiene y sus fechas de vencimiento?';
                }
                
                if (msg.includes('hipotecario') || msg.includes('casa') || msg.includes('vivienda')) {
                    return 'Perfecto, manejo créditos hipotecarios. Puedo ayudarle con recordatorios de cuotas y opciones de refinanciación. ¿Cuál es su banco actual?';
                }
                
                if (msg.includes('carro') || msg.includes('vehículo') || msg.includes('auto')) {
                    return 'Entiendo, tiene un crédito vehicular. Le ayudo con recordatorios de pagos y seguros. ¿Me cuenta los detalles de su crédito?';
                }
                
                if (msg.includes('pago') || msg.includes('cuota')) {
                    return 'Soy Carlos Morales, especialista en organización financiera. ¿Qué pagos necesita recordar? Le ayudo a crear un calendario personalizado.';
                }
                
                return 'Buenos días, soy Carlos, especialista en recordatorios financieros. ¿En qué puedo ayudarle con sus pagos o créditos?';
            }

            // === REPRODUCCIÓN DE AUDIO ===
            async speakResponse(text) {
                console.log('🗣️ Carlos hablando:', text);
                
                this.isCarlosSpeaking = true;
                this.updateCallStatus('🗣️ Carlos asesorando...', 'speaking');
                this.callStatus2.textContent = 'Hablando';
                this.audioVisualizer.style.display = 'block';
                this.transcriptDisplay.textContent = `Carlos: "${text}"`;
                
                this.deactivateMicrophone();

                try {
                    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.ELEVENLABS_VOICE_ID}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'audio/mpeg',
                            'Content-Type': 'application/json',
                            'xi-api-key': this.ELEVENLABS_API_KEY
                        },
                        body: JSON.stringify({
                            text: text,
                            model_id: "eleven_turbo_v2_5",
                            voice_settings: {
                                stability: 0.75,
                                similarity_boost: 0.8,
                                style: 0.3
                            }
                        })
                    });

                    if (response.ok) {
                        const audioBlob = await response.blob();
                        const audioUrl = URL.createObjectURL(audioBlob);
                        this.currentAudio = new Audio(audioUrl);
                        this.currentAudio.volume = this.volume;
                        
                        this.currentAudio.onended = () => {
                            console.log('✅ Carlos terminó de hablar');
                            URL.revokeObjectURL(audioUrl);
                            this.currentAudio = null;
                            this.isCarlosSpeaking = false;
                            this.audioVisualizer.style.display = 'none';
                            this.callStatus2.textContent = 'Disponible';
                            this.transcriptDisplay.textContent = '🎤 Carlos listo - Haga su consulta';
                            
                            if (this.isCallActive) {
                                this.microphoneTimer = setTimeout(() => {
                                    this.activateMicrophone();
                                }, 1000);
                            }
                        };
                        
                        await this.currentAudio.play();
                        
                    } else {
                        throw new Error('ElevenLabs error');
                    }
                    
                } catch (error) {
                    console.error('Error ElevenLabs:', error);
                    this.speakWithBrowser(text);
                }
            }

            speakWithBrowser(text) {
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'es-CO';
                    utterance.volume = this.volume;
                    
                    utterance.onend = () => {
                        console.log('✅ Carlos terminó de hablar (navegador)');
                        this.isCarlosSpeaking = false;
                        this.audioVisualizer.style.display = 'none';
                        this.callStatus2.textContent = 'Disponible';
                        this.transcriptDisplay.textContent = '🎤 Carlos listo - Haga su consulta';
                        
                        if (this.isCallActive) {
                            this.microphoneTimer = setTimeout(() => {
                                this.activateMicrophone();
                            }, 1000);
                        }
                    };
                    
                    speechSynthesis.speak(utterance);
                } else {
                    this.isCarlosSpeaking = false;
                    this.audioVisualizer.style.display = 'none';
                    this.transcriptDisplay.textContent = 'Sin audio - Escriba su consulta';
                    
                    if (this.isCallActive) {
                        setTimeout(() => this.activateMicrophone(), 500);
                    }
                }
            }

            // === CONTROL DE LLAMADA ===
            async startCall() {
                console.log('📞 Iniciando llamada financiera...');
                
                this.isCallActive = true;
                this.callDuration = 0;
                
                this.callButton.style.display = 'none';
                this.endCallButton.style.display = 'flex';
                
                this.updateCallStatus('📞 Conectando con Carlos...', 'connected');
                this.callStatus2.textContent = 'Conectando';
                
                this.audioVisualizer.style.display = 'block';
                
                this.startCallTimer();
                
                const greeting = 'Buenos días, habla Carlos Morales, especialista en recordatorios financieros. Me da mucho gusto contactarle para ayudarle a organizar sus pagos y créditos. ¿En qué consulta financiera puedo asesorarle hoy?';
                
                this.addToConversation(greeting, 'agent');
                
                setTimeout(async () => {
                    await this.speakResponse(greeting);
                }, 1000);
            }

            endCall() {
                console.log('📞 Finalizando llamada financiera...');
                
                this.isCallActive = false;
                this.isCarlosSpeaking = false;
                this.isProcessingResponse = false;
                
                this.callButton.style.display = 'flex';
                this.endCallButton.style.display = 'none';
                
                this.deactivateMicrophone();
                this.stopAudio();
                
                clearTimeout(this.microphoneTimer);
                clearInterval(this.callTimer);
                
                this.updateCallStatus('💰 Carlos listo para gestionar sus finanzas', 'waiting');
                this.callStatus2.textContent = 'Disponible';
                this.transcriptDisplay.textContent = 'Llamada finalizada. ¡Gracias por confiar en nuestro servicio financiero!';
                
                // Reset stats
                setTimeout(() => {
                    this.callDurationEl.textContent = '00:00';
                    this.conversationDisplay.innerHTML = '';
                    this.transcriptDisplay.textContent = 'Sistema financiero optimizado para recordatorios de pagos y asesoría crediticia 💳';
                }, 3000);
            }

            startCallTimer() {
                this.callTimer = setInterval(() => {
                    if (this.isCallActive) {
                        this.callDuration++;
                        const minutes = Math.floor(this.callDuration / 60);
                        const seconds = this.callDuration % 60;
                        this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                }, 1000);
            }

            // === CONTROL DE AUDIO ===
            stopAudio() {
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                    this.currentAudio = null;
                }
                
                if ('speechSynthesis' in window) {
                    speechSynthesis.cancel();
                }
                
                this.isCarlosSpeaking = false;
                this.audioVisualizer.style.display = 'none';
            }

            // === GESTIÓN DE CONVERSACIÓN ===
            addToConversation(message, speaker) {
                const conversationItem = document.createElement('div');
                conversationItem.className = `conversation-item ${speaker === 'customer' ? 'customer-message' : 'agent-message'}`;
                
                const label = document.createElement('div');
                label.className = 'message-label';
                label.textContent = speaker === 'customer' ? '👤 Cliente:' : '💰 Carlos Finanzas:';
                
                const content = document.createElement('div');
                content.textContent = message;
                
                conversationItem.appendChild(label);
                conversationItem.appendChild(content);
                
                this.conversationDisplay.appendChild(conversationItem);
                this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;
                
                // Detectar información del cliente
                if (speaker === 'customer' && !this.clientName) {
                    const nameMatch = message.match(/soy\s+(\w+)|me\s+llamo\s+(\w+)|mi\s+nombre\s+es\s+(\w+)/i);
                    if (nameMatch) {
                        this.clientName = nameMatch[1] || nameMatch[2] || nameMatch[3];
                    }
                }
                
                this.conversationHistory.push({
                    speaker: speaker,
                    message: message,
                    timestamp: new Date()
                });
                
                // Mantener solo las últimas 8 interacciones
                if (this.conversationHistory.length > 8) {
                    this.conversationHistory = this.conversationHistory.slice(-8);
                }
            }
        }

        // Inicializar cuando la página cargue
        document.addEventListener('DOMContentLoaded', () => {
            new CarlosFinanzasSystem();
        });