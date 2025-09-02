// js/agent-system.js - Sistema modular de agentes para producción
class UniversalAgentSystem {
    constructor(agentType) {
        this.agentType = agentType;
        this.isCallActive = false;
        this.isAgentSpeaking = false;
        this.isMicrophoneActive = false;
        this.isProcessingResponse = false;
        
        this.volume = 0.8;
        this.recognition = null;
        this.currentAudio = null;
        this.silenceTimer = null;
        this.microphoneTimer = null;
        
        this.finalTranscript = '';
        this.interimTranscript = '';
        this.conversationHistory = [];
        this.interactionCount = 0;
        this.callStartTime = null;
        this.callTimer = null;
        
        this.initializeElements();
        this.initializeVoiceRecognition();
        this.setupEventListeners();
        
        console.log(`✅ ${this.getAgentName()} System inicializado para producción`);
    }
    
    getAgentName() {
        const names = {
            sofia: 'Sofía Claro',
            carolina: 'Carolina Colsanitas', 
            luis: 'Luis TechStore',
            mariana: 'Mariana Educa',
            juan: 'Juan Ciudadano',
            carlos: 'Carlos Finanzas',
            marcela: 'Marcela RRHH',
            andrea: 'Andrea BancaAmiga',
            andres: 'Andrés OnVacation',
            valentina: 'Valentina Éxito'
        };
        return names[this.agentType] || 'Agente IA';
    }
    
    initializeElements() {
        this.callButton = document.getElementById('callButton');
        this.endCallButton = document.getElementById('endCallButton');
        this.callStatus = document.getElementById('callStatus');
        this.transcriptDisplay = document.getElementById('transcriptDisplay');
        this.conversationDisplay = document.getElementById('conversationDisplay');
        this.audioVisualizer = document.getElementById('audioVisualizer');
        
        // Stats elements
        this.callDurationEl = document.getElementById('callDuration');
        this.responseTimeEl = document.getElementById('responseTime');
        this.callStatusEl = document.getElementById('callStatus2');
        this.interactionsEl = document.getElementById('interactions');
    }
    
    setupEventListeners() {
        if (this.callButton) {
            this.callButton.addEventListener('click', () => this.startCall());
        }
        if (this.endCallButton) {
            this.endCallButton.addEventListener('click', () => this.endCall());
        }
    }
    
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
            this.isMicrophoneActive = true;
            this.updateCallStatus(`🎧 ${this.getAgentName()} escucha - Habla cuando quieras`, 'listening');
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
            if (currentText.trim() && this.transcriptDisplay) {
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
            this.isMicrophoneActive = false;
            
            if (this.isCallActive && !this.isAgentSpeaking) {
                setTimeout(() => this.activateMicrophone(), 1000);
            }
        };

        this.recognition.onend = () => {
            this.isMicrophoneActive = false;
            
            if (this.finalTranscript.trim()) {
                this.processUserInput();
            } else if (this.isCallActive && !this.isAgentSpeaking && !this.isProcessingResponse) {
                setTimeout(() => this.activateMicrophone(), 500);
            }
        };
    }
    
    activateMicrophone() {
        if (!this.isCallActive || this.isAgentSpeaking || this.isProcessingResponse || this.isMicrophoneActive) {
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            setTimeout(() => this.activateMicrophone(), 1000);
        }
    }
    
    deactivateMicrophone() {
        clearTimeout(this.silenceTimer);
        clearTimeout(this.microphoneTimer);
        
        this.isMicrophoneActive = false;
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {}
        }
        
        this.finalTranscript = '';
        this.interimTranscript = '';
    }
    
    async processUserInput() {
        const userMessage = this.finalTranscript.trim();
        if (!userMessage) return;

        this.deactivateMicrophone();
        this.addToConversation(userMessage, 'customer');
        this.interactionCount++;
        this.updateStats();
        
        this.isProcessingResponse = true;
        this.updateCallStatus(`⚡ ${this.getAgentName()} procesando...`, 'processing');
        if (this.callStatusEl) this.callStatusEl.textContent = 'Procesando';

        const startTime = performance.now();

        try {
            const response = await this.getAIResponse(userMessage);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            if (this.responseTimeEl) this.responseTimeEl.textContent = `${responseTime}ms`;
            this.addToConversation(response, 'agent');
            
            this.isProcessingResponse = false;
            await this.speakResponse(response);
            
        } catch (error) {
            console.error('Error procesando:', error);
            this.isProcessingResponse = false;
            const fallbackResponse = 'Disculpa, ¿podrías repetir eso?';
            this.addToConversation(fallbackResponse, 'agent');
            await this.speakResponse(fallbackResponse);
        }
    }
    
    async getAIResponse(userMessage) {
        try {
            const response = await fetch('/api/ai-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    agentType: this.agentType,
                    conversationHistory: this.conversationHistory.slice(-4)
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.fallback) {
                return data.fallback;
            }
            
            return data.response || 'Lo siento, no pude procesar tu consulta.';
            
        } catch (error) {
            console.error('Error API IA:', error);
            return this.getLocalFallback(userMessage);
        }
    }
    
    getLocalFallback(userMessage) {
        const fallbacks = {
            sofia: "Hola, soy Sofía de Claro. ¿En qué plan móvil te puedo ayudar?",
            carolina: "Soy Carolina de Colsanitas. ¿Qué información necesitas sobre seguros médicos?",
            luis: "Hola, soy Luis de TechStore. ¿Qué tecnología buscas?",
            mariana: "Soy Mariana. ¿En qué proceso educativo te puedo asesorar?",
            juan: "Soy Juan. ¿Qué trámite gubernamental necesitas?",
            carlos: "Hola, soy Carlos. ¿En qué tema financiero te ayudo?",
            marcela: "Soy Marcela de RRHH. ¿Necesitas coordinar una entrevista?",
            andrea: "Hola, soy Andrea de BancaAmiga. ¿Qué producto financiero te interesa?",
            andres: "Soy Andrés de OnVacation. ¿Qué destino tienes en mente?",
            valentina: "Hola, soy Valentina de Éxito. ¿Qué ofertas buscas?"
        };
        
        return fallbacks[this.agentType] || "¿En qué puedo ayudarte?";
    }
    
    async speakResponse(text) {
        this.isAgentSpeaking = true;
        this.updateCallStatus(`🗣️ ${this.getAgentName()} respondiendo...`, 'speaking');
        if (this.callStatusEl) this.callStatusEl.textContent = 'Hablando';
        if (this.audioVisualizer) this.audioVisualizer.style.display = 'block';
        if (this.transcriptDisplay) this.transcriptDisplay.textContent = `${this.getAgentName()}: "${text}"`;
        
        this.deactivateMicrophone();

        try {
            // Intentar síntesis de voz con ElevenLabs vía API
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    agentType: this.agentType
                })
            });

            if (response.ok) {
                const data = await response.json();
                const audioBlob = new Blob([
                    new Uint8Array(Buffer.from(data.audio, 'base64'))
                ], { type: 'audio/mpeg' });
                
                const audioUrl = URL.createObjectURL(audioBlob);
                this.currentAudio = new Audio(audioUrl);
                this.currentAudio.volume = this.volume;
                
                this.currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    this.currentAudio = null;
                    this.isAgentSpeaking = false;
                    if (this.audioVisualizer) this.audioVisualizer.style.display = 'none';
                    if (this.callStatusEl) this.callStatusEl.textContent = 'Escuchando';
                    if (this.transcriptDisplay) this.transcriptDisplay.textContent = `🎤 ${this.getAgentName()} terminó - Tu turno`;
                    
                    if (this.isCallActive) {
                        setTimeout(() => this.activateMicrophone(), 1000);
                    }
                };
                
                await this.currentAudio.play();
            } else {
                throw new Error('TTS API failed');
            }
            
        } catch (error) {
            console.error('Error síntesis de voz:', error);
            this.speakWithBrowser(text);
        }
    }
    
    speakWithBrowser(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.volume = this.volume;
            
            utterance.onend = () => {
                this.isAgentSpeaking = false;
                if (this.audioVisualizer) this.audioVisualizer.style.display = 'none';
                if (this.callStatusEl) this.callStatusEl.textContent = 'Escuchando';
                
                if (this.isCallActive) {
                    setTimeout(() => this.activateMicrophone(), 1000);
                }
            };
            
            speechSynthesis.speak(utterance);
        } else {
            this.isAgentSpeaking = false;
            if (this.audioVisualizer) this.audioVisualizer.style.display = 'none';
            if (this.isCallActive) {
                setTimeout(() => this.activateMicrophone(), 500);
            }
        }
    }
    
    async startCall() {
        this.isCallActive = true;
        this.callStartTime = new Date();
        this.interactionCount = 0;
        
        if (this.callButton) {
            this.callButton.style.display = 'none';
        }
        if (this.endCallButton) {
            this.endCallButton.style.display = 'flex';
        }
        
        this.updateCallStatus(`📞 Conectando con ${this.getAgentName()}...`, 'connected');
        if (this.callStatusEl) this.callStatusEl.textContent = 'Conectando';
        
        if (this.conversationDisplay) {
            this.conversationDisplay.innerHTML = '';
        }
        this.conversationHistory = [];
        
        this.startCallTimer();
        
        // Saludo inicial personalizado por agente
        const greeting = this.getAgentGreeting();
        
        setTimeout(async () => {
            this.addToConversation(greeting, 'agent');
            await this.speakResponse(greeting);
        }, 2000);
    }
    
    getAgentGreeting() {
        const greetings = {
            sofia: "¡Hola! Soy Sofía de Claro Colombia. Me da mucho gusto atenderte. ¿En qué puedo ayudarte con nuestros planes móviles hoy?",
            carolina: "¡Hola! Soy Carolina de Colsanitas. Me da mucho gusto atenderle. ¿En qué puedo asistirle con nuestros planes de salud?",
            luis: "¡Hola! Habla Luis de TechStore. Vi que tienes interés en tecnología. ¿Qué tipo de equipo tienes en mente?",
            mariana: "¡Hola! Soy Mariana Educa, especialista en procesos académicos. ¿En qué proceso educativo te puedo ayudar?",
            juan: "Buenos días, habla el Agente Ciudadano. ¿En qué trámite gubernamental puedo asistirle hoy?",
            carlos: "Buenos días, soy Carlos, especialista financiero. ¿En qué consulta financiera puedo asesorarle?",
            marcela: "¡Hola! Soy Marcela de Recursos Humanos. Te contacto para coordinar tu proceso. ¿En qué puedo ayudarte?",
            andrea: "¡Hola! Soy Andrea de BancaAmiga. ¿En qué producto financiero puedo asesorarte hoy?",
            andres: "¡Hola! Soy Andrés de OnVacation. ¿Qué tipo de experiencia de viaje tienes en mente?",
            valentina: "¡Hola! Soy Valentina de Éxito. Tenemos ofertas increíbles. ¿Qué tipo de producto te interesa?"
        };
        
        return greetings[this.agentType] || "¡Hola! ¿En qué puedo ayudarte?";
    }
    
    endCall() {
        this.isCallActive = false;
        this.isAgentSpeaking = false;
        this.isProcessingResponse = false;
        
        if (this.callButton) {
            this.callButton.style.display = 'flex';
        }
        if (this.endCallButton) {
            this.endCallButton.style.display = 'none';
        }
        
        this.deactivateMicrophone();
        this.stopAudio();
        
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        this.updateCallStatus(`📞 ${this.getAgentName()} lista para atender`, 'waiting');
        if (this.callStatusEl) this.callStatusEl.textContent = 'Disponible';
        if (this.transcriptDisplay) {
            this.transcriptDisplay.textContent = `Llamada finalizada. ¡Gracias por contactar a ${this.getAgentName()}!`;
        }
        if (this.audioVisualizer) {
            this.audioVisualizer.style.display = 'none';
        }
        
        // Reset stats
        setTimeout(() => {
            if (this.callDurationEl) this.callDurationEl.textContent = '00:00';
        }, 2000);
    }
    
    startCallTimer() {
        this.callTimer = setInterval(() => {
            if (this.callStartTime && this.isCallActive) {
                const now = new Date();
                const duration = Math.floor((now - this.callStartTime) / 1000);
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                if (this.callDurationEl) {
                    this.callDurationEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }
    
    stopAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        this.isAgentSpeaking = false;
        if (this.audioVisualizer) {
            this.audioVisualizer.style.display = 'none';
        }
    }
    
    updateCallStatus(message, type) {
        if (this.callStatus) {
            this.callStatus.textContent = message;
            this.callStatus.className = `call-status ${type}`;
        }
    }
    
    updateStats() {
        if (this.interactionsEl) {
            this.interactionsEl.textContent = this.interactionCount;
        }
    }
    
    addToConversation(message, speaker) {
        if (!this.conversationDisplay) return;
        
        const conversationItem = document.createElement('div');
        conversationItem.className = `conversation-item ${speaker === 'customer' ? 'customer-message' : 'agent-message'}`;
        
        const label = document.createElement('div');
        label.className = 'message-label';
        label.textContent = speaker === 'customer' ? 'Cliente' : this.getAgentName();
        
        const content = document.createElement('div');
        content.textContent = message;
        
        conversationItem.appendChild(label);
        conversationItem.appendChild(content);
        
        this.conversationDisplay.appendChild(conversationItem);
        this.conversationDisplay.scrollTop = this.conversationDisplay.scrollHeight;
        
        // Mantener historial limitado
        while (this.conversationDisplay.children.length > 10) {
            this.conversationDisplay.removeChild(this.conversationDisplay.firstChild);
        }
        
        this.conversationHistory.push({
            speaker: speaker,
            message: message,
            timestamp: new Date()
        });
        
        // Mantener historial en memoria limitado
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }
}

// Función para inicializar el agente correcto según la página
function initializeAgent() {
    // Detectar qué agente inicializar basado en la URL o un data attribute
    const path = window.location.pathname;
    let agentType = 'sofia'; // Default
    
    if (path.includes('sofia')) agentType = 'sofia';
    else if (path.includes('carolina')) agentType = 'carolina';
    else if (path.includes('luis')) agentType = 'luis';
    else if (path.includes('mariana')) agentType = 'mariana';
    else if (path.includes('juan')) agentType = 'juan';
    else if (path.includes('carlos')) agentType = 'carlos';
    else if (path.includes('marcela')) agentType = 'marcela';
    else if (path.includes('andrea')) agentType = 'andrea';
    else if (path.includes('andres')) agentType = 'andres';
    else if (path.includes('valentina')) agentType = 'valentina';
    
    // También puedes usar un data attribute en el body
    const bodyAgentType = document.body.getAttribute('data-agent');
    if (bodyAgentType) {
        agentType = bodyAgentType;
    }
    
    window.agentSystem = new UniversalAgentSystem(agentType);
}

// Auto-inicializar cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAgent);
} else {
    initializeAgent();
}