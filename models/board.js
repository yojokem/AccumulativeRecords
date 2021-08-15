module.exports = (sequelize, DataTypes) => {
    const Board = sequelize.define('board', {
        name: {
            type: DataTypes.STRING(40),
            allowNull: false
        },
        specifier: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        parent: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        secure: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        locked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'utf8mb4'
    });

    return Board;
}