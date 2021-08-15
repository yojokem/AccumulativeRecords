module.exports = (sequelize, DataTypes) => sequelize.define('alteration', {
    table: {
        type: DataTypes.STRING,
        allowNull: false
    },
    identifier: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    values: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "oldVal·newVal"
    },
    isProper: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    paranoid: true
})