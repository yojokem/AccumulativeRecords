module.exports = (sequelize, DataTypes) => sequelize.define('human', {
    name: {
        type: DataTypes.TEXT('tiny'),
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        defaultValue: null
    },
    address: {
        type: DataTypes.TEXT
    },
    transparency: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20
    },
    completion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 45
    }
}, {
    timestamps: true,
    paranoid: true
})