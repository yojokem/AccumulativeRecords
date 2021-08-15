module.exports = (sequelize, DataTypes) => {
    const Application = sequelize.define('application', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        accept: { //인용
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        unuse: { //취소
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        circle_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'utf8mb4'
    });

    Application.associate = function (models) {
        models.application.belongsTo(models.user, {
            foreignKey: 'user_id'
        });
        models.application.belongsTo(models.circle, {
            foreignKey: 'circle_id'
        });
    };

    return Application;
};