'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Conversations', {
            conversationId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            ChatId: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: 'Chats', // Chats 모델을 참조.
                    key: 'chatId', // Chats 모델의 chatId 참조.
                },
                onDelete: 'CASCADE', // 만약 Chats 모델의 chatId 삭제되면, Conversations 모델의 데이터가 삭제됨.
            },
            isGPT: {
                allowNull: false,
                type: Sequelize.BOOLEAN,
            },
            conversation: {
                allowNull: false,
                type: Sequelize.STRING,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn('now'),
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Conversations');
    },
};
