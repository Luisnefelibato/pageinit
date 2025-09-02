// Universal Agent System - Versión Corregida con Manejo Robusto de APIs
// Corrige errores de JSON y mejora el manejo de respuestas

class UniversalAgentSystem {
    constructor() {
        this.currentAgent = null;
        this.isListening = false;
        this.isThinking = false;
        this.isSpeaking = false;
        this.conversationHistory = [];
        this.volume = 0.8;
        
        // Elementos DOM
        this.chatContainer = null;
        this.messageInput = null;
        this.sendButton = null;
        this.agentAvatar = null;
        this.agentName = null;
        this.statusIndicator = null;
        this.volumeSlider = null;
        
        // Configuración de agentes
        this.agents = {
            sofia: {
                name: "Sofía Rodríguez",
                company: "Claro Colombia",
                specialty: "Telecomunicaciones y planes móviles",
                avatar: "SF",
                color: "#e91e63",
                personality: "Profesional de telecomunicaciones, entusiasta con los planes móviles"
            },
            carolina: {
                name: "Carolina Méndez", 
                company: "Colsanitas EPS",
                specialty: "Seguros médicos y planes de salud",
                avatar: "CM",
                color: "#2196f3",
                personality: "Asesora médica cálida, enfocada en el bienestar familiar"
            },
            luis: {
                name: "Luis García",
                company: "TechStore Pro", 
                specialty: "Tecnología y gadgets",
                avatar: "LG",
                color: "#ff9800",
                personality: "Vendedor tech experto, conoce especificaciones técnicas"
            },
            mariana: {
                name: "Mariana Educa",
                company: "Sector Educativo",
                specialty: "Procesos educativos y matrículas", 
                avatar: "ME",
                color: "#4caf50",
                personality: "Educativa maternal, organizada con procesos académicos"
            },
            juan: {
                name: "Juan Ciudadano",
                company: "Servicios Gubernamentales",
                specialty: "Trámites gubernamentales",
                avatar: "JC", 
                color: "#607d8b",
                personality: "Funcionario eficiente, conoce todos los trámites oficiales"
            },
            carlos: {
                name: "Carlos Finanzas",
                company: "Servicios Crediticios",
                specialty: "Recordatorios financieros y asesoría crediticia",
                avatar: "CF",
                color: "#795548", 
                personality: "Asesor financiero empático, organizado con los pagos"
            },
            marcela: {
                name: "Marcela RRHH",
                company: "Gestión de Talento", 
                specialty: "Recursos humanos y coordinación de entrevistas",
                avatar: "MR",
                color: "#9c27b0",
                personality: "Profesional HR organizada, cálida en el trato"
            },
            andrea: {
                name: "Andrea BancaAmiga",
                company: "Productos Financieros",
                specialty: "Productos bancarios y financieros", 
                avatar: "AB",
                color: "#00bcd4",
                personality: "Asesora bancaria profesional, enfocada en soluciones financieras"
            },
            andres: {
                name: "Andrés OnVacation", 
                company: "Agencia de Viajes",
                specialty: "Paquetes turísticos y viajes",
                avatar: "AV",
                color: "#8bc34a",
                personality: "Agente turístico apasionado, especialista en destinos paradisíacos"
            },
            valentina: {
                name: "Valentina Éxito",
                company: "Supermercados Éxito",
                specialty: "Retail y ofertas comerciales",
                avatar: "VE", 
                color: "#f44336",
                personality: "Vendedora retail entusiasta, experta en promociones"
            }
        };
        
        this.init();
    }

    // ✅ FUNCIÓN CORREGIDA: Convierte base64 a blob sin usar Buffer
    base64ToBlob(base64Data, contentType = 'audio/mpeg') {
        try {
            // Decodificar base64 usando la función nativa del navegador
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            return new Blob([bytes], { type: contentType });
        } catch (error) {
            console.error('Error converting base64 to blob:', error);
            throw new Error('Failed to convert audio data');
        }
    }

    init() {
        this.initializeDOM();
        this.setupEventListeners();
        this.loadAgentFromURL();
    }

    initializeDOM() {
        // Buscar elementos DOM
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.agentAvatar = document.getElementById('agentAvatar');
        this.agentName = document.getElementById('agentName');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.volumeSlider = document.getElementById('volumeSlider');
        
        // Verificar que todos los elementos existen
        if (!this.chatContainer || !this.messageInput || !this.sendButton) {
            console.warn('Algunos elementos DOM no encontrados, creando interface básica');
            this.createBasicInterface();
        }
    }

    createBasicInterface() {
        // Crear interface básica si no existe
        const container = document.body;
        container.innerHTML += `
            <div id="agentInterface" style="max-width: 800px; margin: 20px auto; padding: 20px;">
                <div id="agentHeader" style="text-align: center; margin-bottom: 20px;">
                    <div id="agentAvatar" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;"></div>
                    <h2 id="agentName"></h2>
                    <div id="statusIndicator" style="padding: 5px 15px; border-radius: 15px; display: inline-block; margin-top: 10px;"></div>
                </div>
                <div id="chatContainer" style="height: 400px; border: 1px solid #ddd; border-radius: 10px; overflow-y: auto; padding: 15px; margin-bottom: 15px; background: #f9f9f9;"></div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="messageInput" placeholder="Escribe tu mensaje..." style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 5px;">
                    <button id="sendButton" style="padding: 12px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Enviar</button>
                </div>
                <div style="margin-top: 10px;">
                    <label>Volumen: </label>
                    <input type="range" id="volumeSlider" min="0" max="100" value="80" style="width: 200px;">
                </div>
            </div>
        `;
        
        // Actualizar referencias DOM
        this.initializeDOM();
    }

    setupEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                this.volume = e.target.value / 100;
            });
        }
    }

    loadAgentFromURL() {
        const path = window.location.pathname;
        const agentId = path.split('/').pop();
        
        if (this.agents[agentId]) {
            this.setAgent(agentId);
        } else {
            // Agente por defecto
            this.setAgent('sofia');
        }
    }

    setAgent(agentId) {
        if (!this.agents[agentId]) {
            console.error(`Agente no encontrado: ${agentId}`);
            return;
        }
        
        this.currentAgent = agentId;
        const agent = this.agents[agentId];
        
        // Actualizar UI
        if (this.agentAvatar) {
            this.agentAvatar.textContent = agent.avatar;
            this.agentAvatar.style.backgroundColor = agent.color;
        }
        
        if (this.agentName) {
            this.agentName.textContent = `${agent.name} - ${agent.company}`;
        }
        
        this.updateStatus('Disponible', '#4caf50');
        this.addSystemMessage(`¡Hola! Soy ${agent.name} de ${agent.company}. Especialista en ${agent.specialty}. ¿En qué puedo ayudarte hoy?`);
        
        // Mensaje de bienvenida hablado (opcional, solo si está configurado)
        this.speakWelcomeMessage(agent);
    }

    async speakWelcomeMessage(agent) {
        // Hacer el mensaje de bienvenida opcional para evitar errores en carga inicial
        const welcomeText = `¡Hola! Soy ${agent.name} de ${agent.company}. ¿En qué puedo ayudarte?`;
        try {
            await this.speakResponse(welcomeText, this.currentAgent);
        } catch (error) {
            console.log('Welcome message could not be spoken (this is normal):', error.message);
            // No mostrar error al usuario, es normal que el primer audio falle
        }
    }

    updateStatus(status, color = '#666') {
        if (this.statusIndicator) {
            this.statusIndicator.textContent = status;
            this.statusIndicator.style.backgroundColor = color;
            this.statusIndicator.style.color = 'white';
        }
    }

    addMessage(message, isUser = false, timestamp = new Date()) {
        if (!this.chatContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 10px;
            max-width: 80%;
            ${isUser ? 
                'margin-left: auto; background: #007bff; color: white; text-align: right;' : 
                'margin-right: auto; background: white; border: 1px solid #ddd;'
            }
        `;
        
        const timeStr = timestamp.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 5px;">${message}</div>
            <div style="font-size: 11px; opacity: 0.7;">${timeStr}</div>
        `;
        
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    addSystemMessage(message) {
        this.addMessage(`🤖 ${message}`, false);
    }

    async sendMessage() {
        const message = this.messageInput?.value?.trim();
        if (!message || this.isThinking) return;
        
        // Limpiar input
        if (this.messageInput) this.messageInput.value = '';
        
        // Agregar mensaje del usuario
        this.addMessage(message, true);
        
        // Agregar a historial
        this.conversationHistory.push({
            speaker: 'customer',
            message: message,
            timestamp: new Date()
        });
        
        // Procesar respuesta
        await this.processMessage(message);
    }

    async processMessage(message) {
        this.isThinking = true;
        this.updateStatus('Pensando...', '#ff9800');
        
        try {
            // Obtener respuesta de IA
            const response = await this.getAIResponse(message);
            
            // Agregar respuesta al chat
            this.addMessage(response, false);
            
            // Agregar a historial
            this.conversationHistory.push({
                speaker: 'agent',
                message: response,
                timestamp: new Date()
            });
            
            // Hablar respuesta
            this.updateStatus('Hablando...', '#2196f3');
            this.isSpeaking = true;
            
            await this.speakResponse(response, this.currentAgent);
            
            this.isSpeaking = false;
            this.updateStatus('Disponible', '#4caf50');
            
        } catch (error) {
            console.error('Error processing message:', error);
            this.addSystemMessage('Disculpa, hubo un problema. ¿Puedes repetir tu pregunta?');
            this.updateStatus('Error', '#f44336');
            
            setTimeout(() => {
                this.updateStatus('Disponible', '#4caf50');
            }, 3000);
        }
        
        this.isThinking = false;
    }

    async getAIResponse(message) {
        try {
            const response = await fetch('/api/ai-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    agentType: this.currentAgent,
                    conversationHistory: this.conversationHistory.slice(-6) // Últimas 6 interacciones
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.response) {
                return data.response;
            } else {
                throw new Error(data.error || 'No response received');
            }
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            return this.getFallbackResponse(message);
        }
    }

    getFallbackResponse(message) {
        const agent = this.agents[this.currentAgent];
        const responses = [
            `Como especialista en ${agent.specialty} de ${agent.company}, me gustaría ayudarte mejor. ¿Puedes ser más específico?`,
            `En ${agent.company} nos especializamos en ${agent.specialty}. ¿Qué información específica necesitas?`,
            `Soy ${agent.name} y estoy aquí para ayudarte con ${agent.specialty}. ¿En qué puedo asistirte?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // ✅ MÉTODO COMPLETAMENTE CORREGIDO: speakResponse con manejo robusto de errores
    async speakResponse(text, agentType) {
        if (!text || !agentType) {
            console.log('speakResponse: Missing text or agentType');
            return;
        }
        
        // Limitar longitud del texto para evitar problemas
        const maxLength = 500;
        const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        
        try {
            console.log(`Attempting TTS for ${agentType}: "${truncatedText}"`);
            
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: truncatedText,
                    agentType: agentType
                })
            });
            
            // ✅ VERIFICAR STATUS DE RESPUESTA ANTES DE PARSEAR JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error('TTS API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`TTS API returned ${response.status}: ${response.statusText}`);
            }
            
            // ✅ VERIFICAR QUE HAY CONTENIDO ANTES DE PARSEAR JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('TTS API returned non-JSON response:', responseText);
                throw new Error('TTS API returned invalid response format');
            }
            
            // ✅ PARSEAR JSON CON MANEJO DE ERRORES
            let data;
            try {
                const responseText = await response.text();
                if (!responseText.trim()) {
                    throw new Error('Empty response from TTS API');
                }
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing TTS response JSON:', parseError);
                throw new Error('Invalid JSON response from TTS API');
            }
            
            // ✅ VERIFICAR QUE LA RESPUESTA TIENE LOS DATOS NECESARIOS
            if (!data.success || !data.audio) {
                console.error('TTS API returned unsuccessful response:', data);
                throw new Error(data.error || 'TTS generation failed - no audio data');
            }
            
            // ✅ CONVERTIR Y REPRODUCIR AUDIO
            try {
                const audioBlob = this.base64ToBlob(data.audio, 'audio/mpeg');
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const audio = new Audio(audioUrl);
                audio.volume = this.volume;
                
                // Promesa para esperar que termine el audio
                return new Promise((resolve, reject) => {
                    const cleanup = () => {
                        URL.revokeObjectURL(audioUrl);
                    };
                    
                    audio.addEventListener('ended', () => {
                        cleanup();
                        resolve();
                    });
                    
                    audio.addEventListener('error', (error) => {
                        cleanup();
                        console.error('Audio playback error:', error);
                        reject(new Error('Audio playback failed'));
                    });
                    
                    // Timeout de seguridad (30 segundos)
                    const timeout = setTimeout(() => {
                        cleanup();
                        audio.pause();
                        reject(new Error('Audio playback timeout'));
                    }, 30000);
                    
                    audio.addEventListener('ended', () => clearTimeout(timeout));
                    audio.addEventListener('error', () => clearTimeout(timeout));
                    
                    audio.play().catch(playError => {
                        cleanup();
                        clearTimeout(timeout);
                        console.error('Audio play() failed:', playError);
                        reject(new Error('Could not start audio playback'));
                    });
                });
                
            } catch (audioError) {
                console.error('Error processing audio data:', audioError);
                throw new Error('Failed to process audio data');
            }
            
        } catch (error) {
            console.error('Error síntesis de voz:', error);
            
            // ✅ NO LANZAR ERROR - SOLO REGISTRAR PARA NO INTERRUMPIR LA CONVERSACIÓN
            // Mostrar mensaje discreto al usuario
            if (this.statusIndicator) {
                const originalStatus = this.statusIndicator.textContent;
                const originalColor = this.statusIndicator.style.backgroundColor;
                
                this.updateStatus('Audio no disponible', '#ff9800');
                setTimeout(() => {
                    this.updateStatus(originalStatus, originalColor);
                }, 2000);
            }
        }
    }

    // Métodos auxiliares
    clearConversation() {
        this.conversationHistory = [];
        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
        }
        this.addSystemMessage('Conversación reiniciada');
    }

    exportConversation() {
        const conversation = {
            agent: this.agents[this.currentAgent],
            history: this.conversationHistory,
            timestamp: new Date()
        };
        
        const dataStr = JSON.stringify(conversation, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `conversacion_${this.currentAgent}_${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.volumeSlider) {
            this.volumeSlider.value = this.volume * 100;
        }
    }

    // ✅ MÉTODO DE DIAGNÓSTICO PARA VERIFICAR APIs
    async testAPIs() {
        console.log('🔍 Testing APIs...');
        
        // Test AI Response API
        try {
            const aiResponse = await fetch('/api/ai-response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'test',
                    agentType: 'sofia'
                })
            });
            
            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                console.log('✅ AI Response API working:', aiData);
            } else {
                console.log('❌ AI Response API error:', aiResponse.status);
            }
        } catch (error) {
            console.log('❌ AI Response API failed:', error);
        }
        
        // Test TTS API
        try {
            const ttsResponse = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: 'test',
                    agentType: 'sofia'
                })
            });
            
            if (ttsResponse.ok) {
                console.log('✅ TTS API responds with status 200');
                const contentType = ttsResponse.headers.get('content-type');
                console.log('Content-Type:', contentType);
                
                if (contentType && contentType.includes('application/json')) {
                    const ttsData = await ttsResponse.json();
                    console.log('✅ TTS API working:', { success: ttsData.success, hasAudio: !!ttsData.audio });
                } else {
                    const text = await ttsResponse.text();
                    console.log('❌ TTS API returned non-JSON:', text.substring(0, 200));
                }
            } else {
                console.log('❌ TTS API error:', ttsResponse.status);
            }
        } catch (error) {
            console.log('❌ TTS API failed:', error);
        }
    }
}

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.agentSystem = new UniversalAgentSystem();
    
    // Ejecutar diagnóstico automático en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        setTimeout(() => {
            window.agentSystem.testAPIs();
        }, 2000);
    }
});

// Exportar para uso externo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalAgentSystem;
}
