"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Conversations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Chats, {
        // 2. Chats 모델에게 N:1 관계 설정을 합니다.
        targetKey: "chatId", // 3. Chats 모델의 chatId 컬럼을
        foreignKey: "ChatId", // 4. Conversations 모델의 ChatId 컬럼과 연결합니다.
      });
    }
  }
  Conversations.init(
    {
      conversationId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      ChatId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: "Chats", // Chats 모델을 참조.
          key: "chatId", // Chats 모델의 chatId 참조.
        },
        onDelete: "CASCADE", // 만약 Chats 모델의 chatId 삭제되면, Conversations 모델의 데이터가 삭제됨.
      },
      isGPT: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      conversation: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Conversations",
    }
  );
  return Conversations;
};
