
import { OpenAI } from "openai";
import 'dotenv/config';

async function listModels() {
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    try {
        const models = await groq.models.list();
        console.log("Supported Groq models:");
        models.data.forEach(m => console.log(m.id));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
