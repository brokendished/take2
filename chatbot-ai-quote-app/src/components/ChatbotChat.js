
import React, { useState } from "react";
import "./ChatbotChat.css";

const ChatbotChat = () => {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! What seems to be the issue with your appliance?" }
  ]);
  const [step, setStep] = useState("description");
  const [input, setInput] = useState("");
  const [formData, setFormData] = useState({
    description: "",
    name: "",
    email: "",
    file: null
  });
  const [preview, setPreview] = useState(null);
  const [thinking, setThinking] = useState(false);

  const sendMessage = (text, from = "user") => {
    setMessages((m) => [...m, { from, text }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    sendMessage(input);
    setInput("");

    if (step === "description") {
      setFormData((f) => ({ ...f, description: input }));
      setThinking(true);
      try {
        const res = await fetch("/api/aiQuote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: input })
        });
        const data = await res.json();
        setThinking(false);
        sendMessage(data.reply || "Got it! Forwarding to a contractor.", "bot");
        setStep("photo");
      } catch (e) {
        setThinking(false);
        sendMessage("❌ Error talking to AI. Try again?", "bot");
      }
    } else if (step === "name") {
      setFormData((f) => ({ ...f, name: input }));
      sendMessage("Thanks! What’s your email?", "bot");
      setStep("email");
    } else if (step === "email") {
      setFormData((f) => ({ ...f, email: input }));
      sendMessage("📬 Sending everything to a contractor now!", "bot");
      handleSubmit();
      setStep("done");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((f) => ({ ...f, file }));
    const url = URL.createObjectURL(file);
    setPreview(url);
    sendMessage("[uploaded a photo]");
    sendMessage("Great, now what’s your name?", "bot");
    setStep("name");
  };

  const handleSubmit = async () => {
    const data = new FormData();
    data.append("description", formData.description);
    data.append("name", formData.name);
    data.append("email", formData.email);
    if (formData.file) data.append("file", formData.file);

    try {
      await fetch("/api/sendQuote", {
        method: "POST",
        body: data
      });
      sendMessage("✅ Sent! You’ll hear from a contractor soon.", "bot");
    } catch (e) {
      sendMessage("❌ Something went wrong sending your info.", "bot");
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.from}`}>
            {msg.text}
          </div>
        ))}
        {preview && (
          <div className="chat-bubble user">
            <img src={preview} alt="preview" className="chat-preview" />
          </div>
        )}
        {thinking && <div className="chat-bubble bot">🤖 typing...</div>}
      </div>

      {step === "photo" ? (
        <label className="chat-upload">
          📸 Upload a photo
          <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
        </label>
      ) : step !== "done" ? (
        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      ) : null}
    </div>
  );
};

export default ChatbotChat;
