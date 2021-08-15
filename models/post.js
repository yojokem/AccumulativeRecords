module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('post', {
        title: {
            type: DataTypes.TEXT('tiny'),
            allowNull: false
        },
        board: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: true,
        charset: 'utf8mb4',
        tableName: "posts"
    });

    Post.associate = function(models) {
        models.post.belongsTo(models.user, {
            foreignKey: 'user_id'
        });
        models.post.hasMany(models.browses, {foreignKey: 'post_id', as: 'PostID'});
    };

    return Post;
}