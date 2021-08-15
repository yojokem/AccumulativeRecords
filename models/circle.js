module.exports = (sequelize, DataTypes) => {
    const Circle = sequelize.define('circle', {
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        minimal: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 12
        },
        maximal: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 20
        },
        detail: {
            type: DataTypes.TEXT,
            defaultValue: null
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'utf8mb4'
    });

    Circle.associate = function (models) {
        models.circle.hasMany(models.application, {
            foreignKey: 'circle_id'
        });
        models.circle.hasOne(models.grade_limit, {
            foreignKey: 'circle_id', as: "Limit"
        });
    };

    return Circle;
};