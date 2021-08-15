module.exports = (sequelize, DataTypes) => sequelize.define('trait', {
    given: {
        type: DataTypes.TEXT('tiny'),
        allowNull: false,
        comment: "이름"
    },
    detail: {
        type: DataTypes.TEXT,
        defaultValue: null
    },
    sign: {
        type: DataTypes.BOOLEAN
    }
}, {
    timestamps: true,
    paranoid: true
})