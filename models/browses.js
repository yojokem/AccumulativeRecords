module.exports = (sequelize, DataTypes) => {
    const Browses = sequelize.define('browses', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        post_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ip: {
            type: DataTypes.STRING,
            allowNull: false
        },
        cookie: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'utf8mb4',
        tableName: "browses"
    });

    Browses.associate = function(models) {
        models.browses.belongsTo(models.user, {
            foreignKey: 'user_id'
        });
        models.browses.belongsTo(models.post, {
            foreignKey: 'post_id'
        });
    };

    return Browses;
}