const { GoogleGenAI } = require("@google/genai");
const { chatTools, chatToolDeclarations } = require("./chat.tools");

const getChatResponse = async (req, res, next) => {
    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: "GEMINI_API_KEY is not configured" });
        }

        const ai = new GoogleGenAI({ apiKey });

        const contents = history ? [...history] : [];
        contents.push({ role: "user", parts: [{ text: message }] });

        let response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: "You are a helpful AI assistant for an Employee Management System (EMS). You have tools to query the database. Only use the tools when necessary to answer the user's question.",
                tools: [{ functionDeclarations: chatToolDeclarations }]
            }
        });

        const functionCalls = response.functionCalls;
        
        if (functionCalls && functionCalls.length > 0) {
            const modelMessage = {
                role: "model",
                parts: functionCalls.map(fc => ({ functionCall: fc }))
            };
            contents.push(modelMessage);

            const functionResponsesParts = [];

            for (const call of functionCalls) {
                const fn = chatTools[call.name];
                if (fn) {
                    try {
                        const result = await fn(call.args || {});
                        functionResponsesParts.push({
                            functionResponse: {
                                name: call.name,
                                response: result
                            }
                        });
                    } catch (err) {
                        console.error("Error executing tool", call.name, err);
                        functionResponsesParts.push({
                            functionResponse: {
                                name: call.name,
                                response: { error: err.message }
                            }
                        });
                    }
                }
            }

            contents.push({
                role: "user",
                parts: functionResponsesParts
            });

            response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    systemInstruction: "You are a helpful AI assistant for an Employee Management System (EMS). You have tools to query the database. Only use the tools when necessary to answer the user's question.",
                    tools: [{ functionDeclarations: chatToolDeclarations }]
                }
            });
        }

        res.status(200).json({
            success: true,
            response: response.text,
            history: [
                ...contents,
                { role: "model", parts: [{ text: response.text }] }
            ]
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ success: false, message: "Failed to process chat" });
    }
};

module.exports = {
    getChatResponse
};
