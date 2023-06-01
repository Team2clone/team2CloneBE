'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Credits extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            this.belongsTo(models.Users, {
                // 2. Users 모델에게 1:1 관계 설정을 합니다.
                targetKey: 'userId', // 3. Users 모델의 userId 컬럼을
                foreignKey: 'UserId', // 4. Credits 모델의 UserId 컬럼과 연결합니다.
            });
        }
    }
    Credits.init(
        {
            creditId: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            UserId: {
                allowNull: false,
                type: DataTypes.INTEGER,
                references: {
                    model: 'Users', // Users 모델을 참조합니다.
                    key: 'userId', // Users 모델의 userId를 참조합니다.
                },
                onDelete: 'CASCADE', // 만약 Users 모델의 userId가 삭제되면, Posts 모델의 데이터가 삭제됩니다.
                unique: true,
            },
            credit: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: 'Credits',
        }
    );
    return Credits;
};
