module.exports = (sequelize, DataTypes) => {
    const Case = sequelize.define('case', {
        name: {
            type: DataTypes.TEXT('tiny'),
            allowNull: false
        },
        start: {
            type: DataTypes.DATE,
            defaultValue: null
        },
        end: {
            type: DataTypes.DATE,
            allowNull: false
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        factum_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        verification: {
            type: DataTypes.INTEGER,
            defaultValue: -1
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'utf8mb4' // 이모티콘 넣으려면 mb4 넣어줘야한다.
    });

    return Case;
};