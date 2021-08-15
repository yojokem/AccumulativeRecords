module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
        username: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true // 이메일 주소 형식을 검증한다
            }
        },
        name: {
            type: DataTypes.TEXT('tiny'),
            allowNull: false
        },
        grade: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        class: {
            type: DataTypes.INTEGER,
                allowNull: false
        },
        number: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        position: {
            type: DataTypes.TEXT('tiny'),
            defaultValue: null
        },
        authenticated: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        paranoid: true,
        tableName: "users",
        charset: 'utf8mb4' // 이모티콘 넣으려면 mb4 넣어줘야한다.
    });

    User.associate = function (models) {
        models.user.hasMany(models.position, {
            foreignKey: 'user_id',
            as: 'Position'
        });
        models.user.hasMany(models.post, {
            foreignKey: 'user_id',
            as: 'Post Author'
        });
        models.user.hasMany(models.login_history, {
            foreignKey: 'user_id',
            as: 'LoginHistory'
        });
        models.user.hasMany(models.nickname, {
            foreignKey: 'user_id',
            as: 'NicknameVault'
        });
        models.user.hasMany(models.application, {
            foreignKey: 'user_id'
        });
    }

    return User;
}