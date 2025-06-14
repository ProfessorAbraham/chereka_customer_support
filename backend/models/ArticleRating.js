const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ArticleRating = sequelize.define('ArticleRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Articles',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isHelpful: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'ArticleRatings',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['articleId', 'userId']
    },
    {
      unique: true,
      fields: ['articleId', 'ipAddress']
    }
  ]
});

module.exports = ArticleRating;

