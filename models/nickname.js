module.exports = (sequelize, DataTypes) => {
    const Nickname = sequelize.define('nickname', {
        nickname: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        }
    }, {
        timestamps: true,
        paranoid: true
    });

    Nickname.associate = function (models) {
        models.nickname.belongsTo(models.user, {
            foreignKey: 'user_id'
        })
    };

    return Nickname;
}