module.exports = (sequelize, DataTypes) => {
    const Login_History = sequelize.define('login_history', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: true,
        tableName: "login_history",
        charset: 'utf8mb4' // 이모티콘 넣으려면 mb4 넣어줘야한다.
    });

    Login_History.associate = function (models) {
        models.login_history.belongsTo(models.user, {foreignKey: 'user_id', as: 'Position'});
    }

    return Login_History;
}