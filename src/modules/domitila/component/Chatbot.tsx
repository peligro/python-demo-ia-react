import { useState, useRef, useEffect } from "react";

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "¡Hola César! 👋 Soy Domitila, tu asistente virtual de Tamila. ¿En qué te puedo ayudar hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
    {
      id: 2,
      text: "Hola Domitila, ¿cómo puedo crear un nuevo cliente en el sistema?",
      sender: "user",
      timestamp: new Date(),
    },
    {
      id: 3,
      text: "¡Claro! Para crear un cliente ve a **Clientes > Nuevo Cliente**, completa los datos básicos (nombre, RUT, email) y presiona Guardar. ¿Necesitas ayuda con algún campo específico?",
      sender: "bot",
      timestamp: new Date(),
    },
    {
      id: 4,
      text: "Perfecto, otra consulta: ¿cómo genero una factura electrónica?",
      sender: "user",
      timestamp: new Date(),
    },
    {
      id: 5,
      text: "Para facturar: 1️⃣ Ve a **Ventas > Nueva Factura** 2️⃣ Selecciona el cliente 3️⃣ Agrega los productos/servicios 4️⃣ Revisa los impuestos 5️⃣ Click en **Timbrar y Enviar**. ¿Ya configuraste tu certificado digital?",
      sender: "bot",
      timestamp: new Date(),
    },
    {
      id: 6,
      text: "Aún no, ¿cómo lo configuro?",
      sender: "user",
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message.trim(),
        sender: "user",
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setMessage("");

      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          text: "Gracias por tu mensaje, César. Déjame revisar esa información y te respondo pronto. ¿Hay algo más en lo que pueda ayudarte?",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      }, 1000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className="chatbot-container">
        <button
          className="chatbot-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir chatbot"
          title="Pregúntale a Domitila IA"
        >
          <i className="fas fa-robot"></i>
          <span className="chatbot-badge">?</span>
        </button>

        {isOpen && (
          <div className="chatbot-popup">
            <div className="chatbot-header">
              <div className="d-flex align-items-center">
                <div className="chatbot-avatar me-2">
                  <i className="fas fa-robot"></i>
                </div>
                <h5 className="mb-0">Domitila IA</h5>
              </div>
              <div className="d-flex align-items-center">
                <small className="text-white me-3">
                  <span className="status-dot"></span> Online
                </small>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar chatbot"
                  title="Cerrar"
                ></button>
              </div>
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}
                >
                  <div className="message-content">
                    <p className="mb-0">{msg.text}</p>
                  </div>
                  <div className="message-time">
                    <small>{formatTime(msg.timestamp)}</small>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Escribe tu mensaje..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  type="button"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Chatbot;
