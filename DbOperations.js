const mongoose = require('mongoose');

const MongoDBPassword = process.env['MongoDBPassword'];
const dbName = process.env['DbName'];
const uri = `mongodb+srv://trentconley:${MongoDBPassword}@cluster0.aaepbj6.mongodb.net/${dbName}?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));


const Schema = mongoose.Schema;
let Conversation;
if (mongoose.models.Conversation) {
    Conversation = mongoose.models.Conversation;
} else {
    const ConversationSchema = new Schema({
        userId: String,
        messages: Array
    });
    Conversation = mongoose.model('Conversation', ConversationSchema);
}

const fetchConversation = async (userId) => {
    let conversation = await Conversation.findOne({ userId: userId });
    if (!conversation) {
        // If conversation is not found, create a new one
        conversation = new Conversation({
            userId: userId,
            messages: []
        });
        await conversation.save();  // Save the new conversation to the database
    } else {
        // If conversation is longer than 10 lines, only return the most recent 10 lines
        if (conversation.messages.length > 10) {
            conversation.messages = conversation.messages.slice(-10);
        }
    }
    return conversation;
};


const saveConversation = async (conversation) => {
    const query = { userId: conversation.userId };  // Query by userId
    const update = { messages: conversation.messages };  // Update the messages field
    const options = { upsert: true, new: true };  // Create a new document if not found

    // Update or insert the conversation
    const updatedConversation = await Conversation.findOneAndUpdate(query, update, options);
    return updatedConversation;
};

module.exports = {
    fetchConversation,
    saveConversation  // Export the saveConversation function
};