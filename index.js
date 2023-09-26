require('dotenv').config();
const openAIKey = process.env['OpenAPIKey']
const discordKey = process.env['DiscordKey']


const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})


const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: openAIKey, // defaults to process.env["OPENAI_API_KEY"]
});


const { fetchConversation, saveConversation } = require('./DbOperations');
const mongoose = require('mongoose');

client.on('messageCreate', async (message) => {
    try {
        console.log(`Detected message`)

        if (message.author.bot) return; //prevent infinite loop

        const conversation = await fetchConversation(message.author.id);
        console.log("Fetched Conversation:", conversation);

        const SystemPrompt = { role: 'system', content: process.env['SystemPrompt'] };

        // Ensure messages array is initialized
        if (!conversation.messages) {
            conversation.messages = [];
        }
        const messages = conversation.messages.concat([{ role: 'user', content: message.content }, SystemPrompt]);
        messages.forEach(message => {
            console.log(message);
        });

        console.log(`Messages are ${messages}`);
        const completion = await openai.chat.completions.create({
            messages: messages,
            model: 'gpt-4',
        });

        // Save conversation history
        conversation.messages.push({ role: 'user', content: message.content });
        conversation.messages.push({ role: 'assistant', content: completion.choices[0].message.content });
        await saveConversation(conversation);
        message.reply(`${completion.choices[0].message.content}`)
    } catch (error) {
        console.log(error);
    }
})

client.login(discordKey);
console.log(`Logged in to bot`);