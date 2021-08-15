module.exports = (sequelize, DataTypes) => {
    const Factum = sequelize.define('factum', {
        given: {
            type: DataTypes.TEXT('tiny'),
            allowNull: false,
            comment: "이름"
        },
        detail: {
            type: DataTypes.TEXT,
            defaultValue: null
        },
        parameters: {
            type: DataTypes.JSON,
            defaultValue: {}
        }
    }, {
        timestamps: true,
        paranoid: true,
        tableName: "factum",
        charset: 'utf8mb4'
    });

    Factum.associate = function (models) {
        models.factum.hasMany(models.case, {
            foreignKey: 'factum_id'
        });
    };

    return Factum;
};