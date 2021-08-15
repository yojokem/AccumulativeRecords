module.exports = (sequelize, DataTypes) => {
    const Grade_limit = sequelize.define('grade_limit', {
        option: {
            type: DataTypes.JSON,
            allowNull: false
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

    Grade_limit.associate = function (models) {
        models.grade_limit.belongsTo(models.circle, {
            foreignKey: 'circle_id'
        });
    };

    return Grade_limit;
};