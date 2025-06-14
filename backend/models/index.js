const User = require('./User');
const Ticket = require('./Ticket');
const Message = require('./Message');
const Attachment = require('./Attachment');
const Article = require('./Article');
const Category = require('./Category');
const Tag = require('./Tag');
const ArticleTag = require('./ArticleTag');
const ArticleRating = require('./ArticleRating');
const Setting = require('./Setting');
const ChatRoom = require('./ChatRoom');
const ChatMessage = require('./ChatMessage');
const EmailTemplate = require('./EmailTemplate');
const EmailLog = require('./EmailLog');

// Define associations
User.hasMany(Ticket, { foreignKey: 'customerId', as: 'customerTickets' });
User.hasMany(Ticket, { foreignKey: 'agentId', as: 'agentTickets' });
Ticket.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
Ticket.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });

Ticket.hasMany(Message, { foreignKey: 'ticketId', as: 'messages' });
Message.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Ticket.hasMany(Attachment, { foreignKey: 'ticketId', as: 'attachments' });
Attachment.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'messages' });

// Knowledge base associations
Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' });

Article.belongsToMany(Tag, { through: ArticleTag, foreignKey: 'articleId', as: 'tags' });
Tag.belongsToMany(Article, { through: ArticleTag, foreignKey: 'tagId', as: 'articles' });

Article.hasMany(ArticleRating, { foreignKey: 'articleId', as: 'ratings' });
ArticleRating.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });
ArticleRating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Chat room associations
User.hasMany(ChatRoom, { foreignKey: 'customerId', as: 'customerChatRooms' });
User.hasMany(ChatRoom, { foreignKey: 'agentId', as: 'agentChatRooms' });
ChatRoom.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
ChatRoom.belongsTo(User, { foreignKey: 'agentId', as: 'agent' });

ChatRoom.hasMany(ChatMessage, { foreignKey: 'chatRoomId', as: 'messages' });
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'chatRoomId', as: 'chatRoom' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Email associations
User.hasMany(EmailLog, { foreignKey: 'userId', as: 'emailLogs' });
EmailLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Ticket.hasMany(EmailLog, { foreignKey: 'ticketId', as: 'emailLogs' });
EmailLog.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

module.exports = {
  User,
  Ticket,
  Message,
  Attachment,
  Article,
  Category,
  Tag,
  ArticleTag,
  ArticleRating,
  Setting,
  ChatRoom,
  ChatMessage,
  EmailTemplate,
  EmailLog
};

